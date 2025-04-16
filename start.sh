#!/bin/bash
gunicorn -b 0.0.0.0:${PORT:-10000} app_neon:app