-- Block 2: required database extensions.
-- Safe to review; do not apply to shared environments without approval.

create extension if not exists postgis;
create extension if not exists pgcrypto;
