from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.crud.tag_crud import TagCrud
from app.database.database import get_db
from app.schemas.tag import Tag, TagCreate, TagUpdate
from app.schemas.user import User

router = APIRouter()


@router.get("/", response_model=list[Tag])
async def get_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return TagCrud.get_all_tags(db, current_user.id)


@router.get("/{tag_id}", response_model=Tag)
async def get_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    tag = TagCrud.get_tag_by_id(db, tag_id, current_user.id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return tag


@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    tag.user_id = current_user.id
    return TagCrud.create_tag(db, current_user.id, tag)


@router.put("/{tag_id}", response_model=Tag)
async def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    tag = TagCrud.update_tag(db, tag_id, current_user.id, tag_update)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = TagCrud.delete_tag(db, tag_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
