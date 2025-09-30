from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class TagBase(BaseModel):
    name: str
    color: Optional[str] = None

    @field_validator('color')
    def validate_color(cls, color):
        if color is not None and not (color.startswith('#') and len(color) == 7):
            raise ValueError('Color must be a valid hex color code (e.g., #FF0000)')
        return color

    @field_validator('name')
    def validate_name(cls, name):
        if len(name.strip()) == 0:
            raise ValueError('Tag name cannot be empty')
        if len(name) > 50:
            raise ValueError('Tag name cannot exceed 50 characters')
        return name.strip()


class TagCreate(TagBase):
    user_id: int


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

    @field_validator('color')
    def validate_color(cls, color):
        if color is not None and not (color.startswith('#') and len(color) == 7):
            raise ValueError('Color must be a valid hex color code (e.g., #FF0000)')
        return color

    @field_validator('name')
    def validate_name(cls, name):
        if name is not None:
            if len(name.strip()) == 0:
                raise ValueError('Tag name cannot be empty')
            if len(name) > 50:
                raise ValueError('Tag name cannot exceed 50 characters')
            return name.strip()
        return name


class TagInDB(TagBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class Tag(TagInDB):
    pass