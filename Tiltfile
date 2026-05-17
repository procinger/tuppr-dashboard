update_settings(
  max_parallel_updates = 3,
  k8s_upsert_timeout_secs = 300,
  suppress_unused_image_warnings = None
)

docker_prune_settings(
  disable = False,
  max_age_mins = 30,
  num_builds = 2,
  interval_hrs = 0,
  keep_recent = 2
)

# install required cluster tooling
include('./local-dev/Tiltfile')

docker_build(
  ref = 'localhost:5001/tuppr-dashboard/dashboard',
  context = '.',
  dockerfile = 'Containerfile',
)
