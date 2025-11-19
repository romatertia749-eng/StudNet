from sqlalchemy import Column, BigInteger, String, Integer, Text, DateTime, CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    gender = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    city = Column(String(255), nullable=False, index=True)
    university = Column(String(255), nullable=False, index=True)
    interests = Column(Text, nullable=True)
    goals = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint("gender IN ('male', 'female', 'other')", name='check_gender'),
        CheckConstraint("age >= 15 AND age <= 50", name='check_age'),
        CheckConstraint("LENGTH(bio) <= 200", name='check_bio_length'),
    )

class Swipe(Base):
    __tablename__ = "swipes"
    
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    target_profile_id = Column(BigInteger, ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    action = Column(String(10), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'target_profile_id', name='unique_user_target'),
        CheckConstraint("action IN ('like', 'pass')", name='check_action'),
    )

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(BigInteger, primary_key=True, index=True)
    user1_id = Column(BigInteger, ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False, index=True)
    user2_id = Column(BigInteger, ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False, index=True)
    matched_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='unique_match'),
        CheckConstraint("user1_id < user2_id", name='check_user_order'),
    )

