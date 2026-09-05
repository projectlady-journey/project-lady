Project Lady Phase3 v0.5.4

Saved-journey reincarnation fix, second pass.

Changes:
- Registry is normalized every load/save.
- Saved journey with the same ID as the active journey is removed.
- Saved journey IDs are deduplicated.
- Empty new-journey shells are never saved.
- Blank shells accidentally contaminated with the Osaka/Kinan legacy seed are purged.
- Welcome answers alone no longer make an empty shell a saved journey.
- Legacy profile/transport keys can no longer repopulate a deliberately blank new journey.
- Resuming a saved journey only shelves the previous active journey when it contains real trip data.
- Cache query bumped to v0.5.4.
