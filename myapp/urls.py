from django.urls import path,include
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)
from django.contrib.auth import views as auth_views

router = DefaultRouter()

router.register(r"bug_reporter",BugReporterViewSet,basename="bug_reporter")
router.register(r"user",CustomUserViewSet,basename="user")


urlpatterns = [
    path('home/',home,name="home"),
    path('login/',auth_views.LoginView.as_view(template_name = "myapp/login.html"),name="login"),
    path('logout/confirm/',LogoutConfirmView.as_view(),name="logout-confirm"),
    path('logout/',LogOutView.as_view(),name="logout"),
    path('api/token/',TokenObtainPairView.as_view(),name="token_obtain_api"),
    path('api/token/refresh/',TokenRefreshView.as_view(),name="token_refresh_api"),
] + router.urls