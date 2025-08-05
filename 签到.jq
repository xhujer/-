.data.strategies |= map(
  select(
    (.type != "BIZ_IDLE_COIN_ENTRANCE_2") and
    (.type != "BIZ_PUBLISH_BALL")
  )
)