import json
import random
import secrets
import urllib.parse
import urllib.request

from django.conf import settings
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse

FALLBACK_FRIENDS = [
    "Yusuf Islam",
    "Nusrat Jahan",
    "Arafat Hossain",
    "Mahi Ahmed",
    "Rafiq Rahman",
    "Tasnim Akter",
    "Tanvir Hasan",
    "Sabrina Noor",
    "Imran Chowdhury",
    "Lamia Sultana",
    "Farhan Kabir",
    "Jannat Ara",
]


def _fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=10) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def _get_graph_base() -> str:
    version = settings.FACEBOOK_API_VERSION or "v18.0"
    return f"https://graph.facebook.com/{version}"


def index(request):
    return render(request, "index.html")


def facebook_login(request):
    app_id = settings.FACEBOOK_APP_ID
    app_secret = settings.FACEBOOK_APP_SECRET
    if not app_id or not app_secret:
        return HttpResponseBadRequest(
            "Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET. Add them to your .env file."
        )

    state = secrets.token_urlsafe(16)
    request.session["fb_oauth_state"] = state

    redirect_uri = settings.FACEBOOK_REDIRECT_URI
    if not redirect_uri:
        redirect_uri = request.build_absolute_uri(reverse("auth_callback"))

    params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": "public_profile,user_friends",
        "response_type": "code",
    }
    auth_url = "https://www.facebook.com/dialog/oauth?" + urllib.parse.urlencode(params)
    return redirect(auth_url)


def facebook_callback(request):
    app_id = settings.FACEBOOK_APP_ID
    app_secret = settings.FACEBOOK_APP_SECRET
    if not app_id or not app_secret:
        return HttpResponseBadRequest(
            "Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET. Add them to your .env file."
        )

    state = request.GET.get("state")
    code = request.GET.get("code")
    saved_state = request.session.get("fb_oauth_state")
    if not state or state != saved_state:
        return HttpResponseBadRequest("Invalid OAuth state. Please try again.")
    if not code:
        return HttpResponseBadRequest("Missing OAuth code. Please try again.")

    redirect_uri = settings.FACEBOOK_REDIRECT_URI
    if not redirect_uri:
        redirect_uri = request.build_absolute_uri(reverse("auth_callback"))

    token_params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "client_secret": app_secret,
        "code": code,
    }
    token_url = _get_graph_base() + "/oauth/access_token?" + urllib.parse.urlencode(token_params)

    try:
        token_data = _fetch_json(token_url)
    except Exception:
        return HttpResponseBadRequest("Could not fetch access token. Check your app settings.")

    access_token = token_data.get("access_token")
    if not access_token:
        return HttpResponseBadRequest("Access token missing in response. Please try again.")

    request.session["fb_access_token"] = access_token
    request.session.pop("fb_oauth_state", None)
    return redirect("/")


def facebook_logout(request):
    request.session.pop("fb_access_token", None)
    return redirect("/")


def status_api(request):
    connected = bool(request.session.get("fb_access_token"))
    return JsonResponse({"connected": connected})


def spin_api(request):
    amount_label = request.GET.get("amount", "")
    access_token = request.session.get("fb_access_token")
    connected = bool(access_token)
    friends = []
    source = "demo"

    if access_token:
        friends_url = _get_graph_base() + "/me/friends?" + urllib.parse.urlencode(
            {"access_token": access_token}
        )
        try:
            data = _fetch_json(friends_url)
            friends = data.get("data", []) or []
            connected = True
        except Exception:
            connected = False
            friends = []

    if friends:
        friend = random.choice(friends)
        friend_name = friend.get("name", "Friend")
        source = "facebook"
    else:
        friend_name = random.choice(FALLBACK_FRIENDS)

    return JsonResponse(
        {
            "connected": connected,
            "amount": amount_label,
            "friend": {"name": friend_name, "source": source},
        }
    )
