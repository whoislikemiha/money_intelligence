from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class CategoryValidationMixin(BaseModel):
    @field_validator('color')
    def validate_color(cls, color):
        if color is not None and not (color.startswith('#') and len(color) == 7):
            raise ValueError('Color must be a valid hex color code (e.g., #FF0000)')
        return color

    @field_validator('name')
    def validate_name(cls, name):
        if name is not None:
            if len(name.strip()) == 0:
                raise ValueError('Category name cannot be empty')
            if len(name) > 100:
                raise ValueError('Category name cannot exceed 100 characters')
            return name.strip()
        return name

    @field_validator('icon')
    def validate_icon(cls, icon):
        if icon is not None and len(icon) > 50:
            raise ValueError('Icon name cannot exceed 50 characters')
        return icon


class CategoryBase(CategoryValidationMixin):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    user_id: int


class CategoryUpdate(CategoryValidationMixin):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryInDB(CategoryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class Category(CategoryInDB):
    pass