from pydantic import BaseModel
from typing import List

class CommentCreate(BaseModel):
    author: str
    content: str

class Comment(CommentCreate):
    pass

class PostCreate(BaseModel):
    title: str
    content: str
    author: str

class Post(PostCreate):
    id: int
    comments: List[Comment]
