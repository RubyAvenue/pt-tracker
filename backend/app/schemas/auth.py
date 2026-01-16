from pydantic import BaseModel, EmailStr

from app.schemas.user import UserRead


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupWithInviteRequest(BaseModel):
    invite_code: str
    email: EmailStr
    display_name: str | None = None
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class BootstrapRequest(BaseModel):
    bootstrap_token: str
    email: EmailStr
    display_name: str | None = None
    password: str
