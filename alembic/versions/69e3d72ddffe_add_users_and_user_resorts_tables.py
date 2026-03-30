"""add users and user_resorts tables

Revision ID: 69e3d72ddffe
Revises: ac476b324a60
Create Date: 2026-03-29 21:18:56.126554

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69e3d72ddffe'
down_revision: Union[str, None] = 'ac476b324a60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('provider_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('provider_id'),
    )
    op.create_table(
        'user_resorts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('resort_id', sa.String(), nullable=False),
        sa.Column('added_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['resort_id'], ['resorts.id']),
        sa.UniqueConstraint('user_id', 'resort_id'),
    )
    op.create_index('ix_user_resorts_user_id', 'user_resorts', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_user_resorts_user_id', table_name='user_resorts')
    op.drop_table('user_resorts')
    op.drop_table('users')
