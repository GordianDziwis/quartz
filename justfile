develop:
  while true; do npx quartz build --directory ~/cloud/wiki --concurrency 7 --watch --serve --port 9000; sleep 2; done

