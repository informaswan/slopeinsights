"""add snow_forecasts

Revision ID: b9d4e1f3a2c6
Revises: a8e2c5d7b901
Create Date: 2026-09-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b9d4e1f3a2c6'
down_revision: Union[str, None] = 'a8e2c5d7b901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return _inspector().has_table(name)


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def upgrade() -> None:
    # The app's startup create_all() creates brand-new tables on its own.
    if _has_table('snow_forecasts'):
        return
    op.create_table('snow_forecasts',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('resort_id', sa.String(), nullable=False),
    sa.Column('next_24h_in', sa.Float(), nullable=True),
    sa.Column('next_48h_in', sa.Float(), nullable=True),
    sa.Column('next_72h_in', sa.Float(), nullable=True),
    sa.Column('scraped_at', sa.DateTime(), nullable=False),
    sa.Column('is_stale', sa.Boolean(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_snow_forecasts_resort_id'), 'snow_forecasts', ['resort_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_snow_forecasts_resort_id'), table_name='snow_forecasts')
    op.drop_table('snow_forecasts')
