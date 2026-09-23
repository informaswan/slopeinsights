"""drop crowd_data (it only ever held synthetic day-of-week patterns)

Revision ID: a8e2c5d7b901
Revises: f7c3a9d0e1b2
Create Date: 2026-09-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a8e2c5d7b901'
down_revision: Union[str, None] = 'f7c3a9d0e1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return _inspector().has_table(name)


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def upgrade() -> None:
    if not _has_table('crowd_data'):
        return
    op.drop_index(op.f('ix_crowd_data_resort_id'), table_name='crowd_data')
    op.drop_table('crowd_data')


def downgrade() -> None:
    op.create_table('crowd_data',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('resort_id', sa.String(), nullable=False),
    sa.Column('day_of_week', sa.Integer(), nullable=False),
    sa.Column('hourly_json', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('resort_id', 'day_of_week')
    )
    op.create_index(op.f('ix_crowd_data_resort_id'), 'crowd_data', ['resort_id'], unique=False)
