from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("auth/login/", views.facebook_login, name="auth_login"),
    path("auth/callback/", views.facebook_callback, name="auth_callback"),
    path("auth/logout/", views.facebook_logout, name="auth_logout"),
    path("api/status/", views.status_api, name="status_api"),
    path("api/spin/", views.spin_api, name="spin_api"),
]
