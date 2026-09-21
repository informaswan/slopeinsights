FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN adduser --disabled-password --gecos "" appuser \
    && mkdir /data \
    && chown -R appuser /app /data
USER appuser

EXPOSE 8000

# Behind nginx every request arrives from the proxy, so read the real client IP from
# X-Forwarded-For (nginx overwrites it with $remote_addr) or all visitors share one
# rate-limit bucket. Safe to trust "*" because compose binds the port to localhost only.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
