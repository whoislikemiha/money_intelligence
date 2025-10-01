"""fix_transaction_tags_table

Revision ID: 0340795a8c24
Revises: d42c27916139
Create Date: 2025-10-01 19:05:43.949008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0340795a8c24'
down_revision: Union[str, Sequence[str], None] = 'd42c27916139'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the old transaction_tags table
    op.drop_table('transaction_tags')

    # Recreate transaction_tags with only the necessary columns
    op.create_table(
        'transaction_tags',
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('transaction_id', 'tag_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the new transaction_tags table
    op.drop_table('transaction_tags')

    # Recreate the old transaction_tags table with extra columns
    op.create_table(
        'transaction_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
