from fastapi import APIRouter, Depends

from backend.app.core.dependencies import get_current_admin
from backend.app.models.user import User

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


@router.get("/me", summary="Get Current Admin Profile")
def get_admin_profile(
    current_user: User = Depends(get_current_admin),
):
    return {
        "message": "Authenticated admin access successful",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "is_active": current_user.is_active,
            "is_superuser": current_user.is_superuser,
        },
    }