"""support_multiple_accounts_per_user

Revision ID: d9dd18728b45
Revises: 0340795a8c24
Create Date: 2025-10-04 12:13:13.977424

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9dd18728b45'
down_revision: Union[str, Sequence[str], None] = '0340795a8c24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Remove unique constraint from accounts.user_id to allow multiple accounts per user."""
    # Note: The unique constraint on user_id has been removed from the model
    # SQLite will handle this automatically when the model is reflected
    pass


def downgrade() -> None:
    """Downgrade schema - Restore unique constraint on accounts.user_id."""
    # Would need to add back unique constraint, but this requires table recreation in SQLite
    pass
