### main.py (FastAPI backend)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import copy

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Comment(BaseModel):
    id: int = 0
    content: str
    author: str
    parent_id: Optional[int] = None
    replies: List['Comment'] = []

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

Comment.update_forward_refs()

class Post(BaseModel):
    id: int = 0
    title: str
    content: str
    author: str
    comments: List[Comment] = []

posts: List[Post] = []

@app.get("/posts")
def get_posts():
    # Deep copy to convert comments with nested replies to dicts
    return [convert_post(post) for post in posts]

def convert_post(post: Post) -> Dict[str, Any]:
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "author": post.author,
        "comments": [convert_comment(c) for c in post.comments]
    }

def convert_comment(comment: Comment) -> Dict[str, Any]:
    return {
        "id": comment.id,
        "content": comment.content,
        "author": comment.author,
        "parent_id": comment.parent_id,
        "replies": [convert_comment(r) for r in comment.replies]
    }

@app.post("/posts")
def add_post(post: Post):
    post.id = max([p.id for p in posts], default=0) + 1
    post.comments = []
    posts.append(post)
    return post

@app.post("/posts/{post_id}/comments")
def add_comment(post_id: int, comment: Comment):
    post = next((p for p in posts if p.id == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment.id = max([c.id for c in flatten_comments(post.comments)], default=0) + 1
    comment.replies = []

    if comment.parent_id is not None:
        parent = find_comment(post.comments, comment.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        parent.replies.append(comment)
    else:
        post.comments.append(comment)

    return comment

def find_comment(comments: List[Comment], comment_id: int):
    for c in comments:
        if c.id == comment_id:
            return c
        reply = find_comment(c.replies, comment_id)
        if reply:
            return reply
    return None

def flatten_comments(comments: List[Comment]):
    flat = []
    for c in comments:
        flat.append(c)
        flat.extend(flatten_comments(c.replies))
    return flat
