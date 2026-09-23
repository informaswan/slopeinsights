# tests/test_feedback.py
from unittest.mock import patch, MagicMock
from app.models.feedback import Feedback

H = {"X-API-Key": "dev-key"}


def _post(client, **overrides):
    body = {"category": "idea", "message": "Please add a compare page", "email": "me@example.com"}
    body.update(overrides)
    return client.post("/api/feedback", json=body, headers=H)


def test_feedback_is_saved(client, db):
    r = _post(client)
    assert r.status_code == 200 and r.json() == {"ok": True}
    row = db.query(Feedback).one()
    assert (row.category, row.message, row.email) == ("idea", "Please add a compare page", "me@example.com")


def test_email_is_optional_and_blank_becomes_none(client, db):
    assert _post(client, email="").status_code == 200
    assert _post(client, email=None).status_code == 200
    assert [f.email for f in db.query(Feedback).all()] == [None, None]


def test_bad_input_is_rejected(client, db):
    assert _post(client, message="hi").status_code == 422          # too short
    assert _post(client, message="x" * 2001).status_code == 422    # too long
    assert _post(client, email="not-an-email").status_code == 422
    assert _post(client, category="spam").status_code == 422
    assert db.query(Feedback).count() == 0


def test_honeypot_submissions_are_dropped_but_look_successful(client, db):
    r = _post(client, website="http://spam.example")
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert db.query(Feedback).count() == 0


def test_sixth_submission_in_an_hour_is_rate_limited(client, db):
    assert [_post(client).status_code for _ in range(5)] == [200] * 5
    assert _post(client).status_code == 429


def test_emails_a_copy_when_smtp_is_configured(client, db, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "feedback_to_email", "owner@example.com")
    monkeypatch.setattr(settings, "smtp_user", "owner@example.com")
    monkeypatch.setattr(settings, "smtp_password", "pw")
    with patch("app.notify.smtplib.SMTP") as smtp_cls:
        smtp = smtp_cls.return_value.__enter__.return_value = MagicMock()
        assert _post(client).status_code == 200
    smtp.starttls.assert_called_once()
    smtp.login.assert_called_once_with("owner@example.com", "pw")
    sent = smtp.send_message.call_args[0][0]
    assert sent["To"] == "owner@example.com" and sent["Reply-To"] == "me@example.com"
    assert "Please add a compare page" in sent.get_content()


def test_no_email_is_attempted_when_smtp_is_not_configured(client, db):
    with patch("app.notify.smtplib.SMTP") as smtp_cls:
        assert _post(client).status_code == 200
    smtp_cls.assert_not_called()


def test_a_mail_failure_never_loses_or_fails_the_submission(client, db, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "feedback_to_email", "owner@example.com")
    with patch("app.notify.smtplib.SMTP", side_effect=OSError("mail server down")):
        assert _post(client).status_code == 200
    assert db.query(Feedback).count() == 1


def test_every_address_in_a_comma_separated_list_gets_the_email(client, db, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "feedback_to_email", "a@example.com, b@example.com ,c@example.com")
    with patch("app.notify.smtplib.SMTP") as smtp_cls:
        smtp = smtp_cls.return_value.__enter__.return_value = MagicMock()
        assert _post(client).status_code == 200
    sent = smtp.send_message.call_args[0][0]
    assert sent["To"] == "a@example.com, b@example.com, c@example.com"
