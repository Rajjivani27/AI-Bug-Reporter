from django.urls import path,include
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

router = DefaultRouter()

router.register(r"bug_reporter",BugReporterViewSet,basename="bug_reporter")
router.register(r"user",CustomUserViewSet,basename="user")


urlpatterns = [
    path('api/token/',TokenObtainPairView.as_view(),name="token_obtain_api"),
    path('api/token/refresh/',TokenRefreshView.as_view(),name="token_refresh_api"),
] + router.urls