# =============================================================
# FootyLab data builder — players stage (Fryzigg) — v0.1.0
# -------------------------------------------------------------
# Downloads the community Fryzigg dataset (single RDS blob of
# player-game rows, ~80 columns of stats) and splits it into
# per-season compact JSON: data/players/<year>.json
#   { "v":1, "year":Y, "cols":[...], "rows":[[...], ...] }
# plus data/players/index.json listing seasons + row counts.
#
# Incremental: past seasons already on disk are kept; the
# current season is always rewritten. The RDS itself is one
# download per run (the source is a single file by design).
#
# Thanks to Fryzigg for maintaining this dataset.
# =============================================================
options(timeout = 600)
RDS_URL <- "http://www.fryziggafl.net/static/fryziggafl.rds"

if (!requireNamespace("jsonlite", quietly = TRUE)) {
  stop("jsonlite is required: Rscript -e 'install.packages(\"jsonlite\")'")
}

dir.create("data/players", recursive = TRUE, showWarnings = FALSE)

message("downloading Fryzigg dataset (single RDS, may take a minute)...")
con <- url(RDS_URL, "rb")
df <- readRDS(con)
close(con)
message(sprintf("loaded %d rows x %d cols", nrow(df), ncol(df)))

# season column: use match_date year (dataset has one row per player per game)
date_col <- if ("match_date" %in% names(df)) "match_date" else "date"
df$fl_season <- as.integer(substr(as.character(df[[date_col]]), 1, 4))
df <- df[!is.na(df$fl_season), ]

cur_year <- as.integer(format(Sys.Date(), "%Y"))
years <- sort(unique(df$fl_season))
index <- list()

for (y in years) {
  out <- sprintf("data/players/%d.json", y)
  sub <- df[df$fl_season == y, names(df) != "fl_season", drop = FALSE]
  index[[as.character(y)]] <- nrow(sub)
  if (file.exists(out) && y < cur_year) next  # past seasons are immutable
  payload <- list(v = 1L, year = y, cols = names(sub), rows = sub)
  jsonlite::write_json(payload, out, dataframe = "values",
                       auto_unbox = TRUE, na = "null", digits = 4)
  message(sprintf("  wrote %s (%d rows)", out, nrow(sub)))
}

jsonlite::write_json(
  list(v = 1L, built = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
       source = RDS_URL, years = index),
  "data/players/index.json", auto_unbox = TRUE)
message("wrote data/players/index.json")
