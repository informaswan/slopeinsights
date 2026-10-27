"""add summit_high_f / summit_low_f to weather_forecasts

Revision ID: e5b8c2a4d6f1
Revises: c1e7a3b5d9f2
Create Date: 2026-10-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5b8c2a4d6f1'
down_revision: Union[str, None] = 'c1e7a3b5d9f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMNS = ('summit_high_f', 'summit_low_f')


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in sa.inspect(op.get_bind()).get_columns(table))


def upgrade() -> None:
    for name in _COLUMNS:
        if not _has_column('weather_forecasts', name):
            op.add_column('weather_forecasts', sa.Column(name, sa.Float(), nullable=True))


def downgrade() -> None:
    for name in _COLUMNS:
        op.drop_column('weather_forecasts', name)
