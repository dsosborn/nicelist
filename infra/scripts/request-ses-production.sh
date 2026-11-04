#!/bin/sh
set -eu
# Asks SES to leave the sandbox. Safe to re-run after the account is already in production.
aws sesv2 put-account-details \
  --production-access-enabled \
  --mail-type TRANSACTIONAL \
  --website-url "https://nicelist.co" \
  --use-case-description "Nicelist sends account verification codes and password resets to people who sign up for a private Christmas wishlist trial. No marketing mail." \
  --contact-language EN
