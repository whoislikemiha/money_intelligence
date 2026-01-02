from sqlalchemy.orm import Session
from app.database.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate


class TagCrud:
    @staticmethod
    def create_tag(db: Session, user_id: int, tag: TagCreate) -> Tag:
        tag_data = tag.model_dump()
        new_tag = Tag(
            user_id=user_id,
            name=tag_data["name"],
            color=tag_data.get("color"),
        )
        db.add(new_tag)
        db.commit()
        db.refresh(new_tag)
        return new_tag

    @staticmethod
    def get_all_tags(db: Session, user_id: int) -> list[Tag]:
        return db.query(Tag).filter(Tag.user_id == user_id).all()

    @staticmethod
    def get_tag_by_id(db: Session, tag_id: int, user_id: int) -> Tag | None:
        return db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()

    @staticmethod
    def get_tag_by_name(db: Session, user_id: int, name: str) -> Tag | None:
        return db.query(Tag).filter(Tag.user_id == user_id, Tag.name == name).first()

    @staticmethod
    def update_tag(db: Session, tag_id: int, user_id: int, tag_update: TagUpdate) -> Tag | None:
        tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()
        if not tag:
            return None

        update_data = tag_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tag, field, value)

        db.commit()
        db.refresh(tag)
        return tag

    @staticmethod
    def delete_tag(db: Session, tag_id: int, user_id: int) -> bool:
        tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()
        if not tag:
            return False

        db.delete(tag)
        db.commit()
        return True
