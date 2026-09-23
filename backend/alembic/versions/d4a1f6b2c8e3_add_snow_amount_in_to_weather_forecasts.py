"""add snow_amount_in to weather_forecasts

Revision ID: d4a1f6b2c8e3
Revises: 69e3d72ddffe
Create Date: 2026-09-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a1f6b2c8e3'
down_revision: Union[str, None] = '69e3d72ddffe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return _inspector().has_table(name)


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def upgrade() -> None:
    # The app's startup create_all() may already have made this table without the column;
    # skip if a previous run added it.
    if _has_column('weather_forecasts', 'snow_amount_in'):
        return
    op.add_column('weather_forecasts', sa.Column('snow_amount_in', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('weather_forecasts', 'snow_amount_in')
