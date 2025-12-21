import argparse
import json
from collections import Counter
from pathlib import Path


POSTS_COLUMNS = [
    "ID",
    "post_author",
    "post_date",
    "post_date_gmt",
    "post_content",
    "post_title",
    "post_excerpt",
    "post_status",
    "comment_status",
    "ping_status",
    "post_password",
    "post_name",
    "to_ping",
    "pinged",
    "post_modified",
    "post_modified_gmt",
    "post_content_filtered",
    "post_parent",
    "guid",
    "menu_order",
    "post_type",
    "post_mime_type",
    "comment_count",
]


def normalize_upload_path(value: str) -> str:
    if not value:
        return value
    trimmed = value.strip()
    if not trimmed:
        return trimmed

    if trimmed.startswith("http://") or trimmed.startswith("https://"):
        marker = "/wp-content/uploads/"
        if marker in trimmed:
            return marker + trimmed.split(marker, 1)[1]
        return trimmed

    if trimmed.startswith("/wp-content/"):
        return trimmed

    return "/wp-content/uploads/" + trimmed.lstrip("/")


def parse_value(raw: str):
    text = raw.strip()
    if text == "NULL":
        return None
    if text == "":
        return ""
    if text.isdigit():
        try:
            return int(text)
        except ValueError:
            return text
    return text


def parse_rows(data: str):
    rows = []
    row = []
    value = ""
    in_string = False
    escape = False
    in_row = False
    i = 0

    while i < len(data):
        ch = data[i]
        if in_string:
            if escape:
                value += ch
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == "'":
                if i + 1 < len(data) and data[i + 1] == "'":
                    value += "'"
                    i += 1
                else:
                    in_string = False
            else:
                value += ch
        else:
            if ch == "'":
                in_string = True
            elif ch == "(":
                in_row = True
                row = []
                value = ""
            elif ch == "," and in_row:
                row.append(parse_value(value))
                value = ""
            elif ch == ")" and in_row:
                row.append(parse_value(value))
                rows.append(row)
                in_row = False
                value = ""
            else:
                if in_row:
                    value += ch
        i += 1

    return rows


def find_statement_end(data: str, start: int) -> int:
    in_string = False
    escape = False
    i = start

    while i < len(data):
        ch = data[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == "'":
                if i + 1 < len(data) and data[i + 1] == "'":
                    i += 1
                else:
                    in_string = False
        else:
            if ch == "'":
                in_string = True
            elif ch == ";":
                return i
        i += 1
    return -1


def iter_insert_values(sql_path: Path, table_name: str):
    start_token = f"INSERT INTO `{table_name}` VALUES "
    data = sql_path.read_text(encoding="utf-8", errors="ignore")
    pos = 0

    while True:
        idx = data.find(start_token, pos)
        if idx == -1:
            break
        values_start = idx + len(start_token)
        end = find_statement_end(data, values_start)
        if end == -1:
            break
        yield data[values_start:end]
        pos = end + 1


def extract_wp_media(sql_path: Path):
    posts = {}
    attachments = {}
    post_type_counts = Counter()

    for chunk in iter_insert_values(sql_path, "wp_posts"):
        for row in parse_rows(chunk):
            if len(row) < len(POSTS_COLUMNS):
                continue
            post = dict(zip(POSTS_COLUMNS, row))
            post_id = post["ID"]
            posts[post_id] = post
            post_type = post.get("post_type") or ""
            post_type_counts[post_type] += 1
            if post_type == "attachment":
                attachments[post_id] = post

    thumbnail_by_post = {}
    attached_file_by_post = {}

    for chunk in iter_insert_values(sql_path, "wp_postmeta"):
        for row in parse_rows(chunk):
            if len(row) < 4:
                continue
            _, post_id, meta_key, meta_value = row[:4]
            if meta_key == "_thumbnail_id" and meta_value:
                try:
                    thumbnail_by_post[int(post_id)] = int(str(meta_value))
                except ValueError:
                    continue
            elif meta_key == "_wp_attached_file" and meta_value:
                attached_file_by_post[int(post_id)] = str(meta_value)

    return posts, attachments, thumbnail_by_post, attached_file_by_post, post_type_counts


def build_featured_map(posts, attachments, thumbnail_by_post, attached_file_by_post):
    results = []
    for post_id, thumb_id in thumbnail_by_post.items():
        post = posts.get(post_id)
        if not post:
            continue
        post_type = post.get("post_type")
        status = post.get("post_status")
        if post_type == "revision":
            continue
        if status not in ("publish", "inherit"):
            continue
        slug = post.get("post_name") or ""
        if not slug:
            continue
        attachment = attachments.get(thumb_id)
        attached_file = attached_file_by_post.get(thumb_id) or ""
        guid = attachment.get("guid") if attachment else None
        image_path = normalize_upload_path(attached_file or guid or "")
        if not image_path:
            continue
        results.append(
            {
                "post_id": post_id,
                "post_type": post_type,
                "status": status,
                "slug": slug,
                "title": post.get("post_title"),
                "featured_image": image_path,
                "attachment_id": thumb_id,
                "attachment_title": attachment.get("post_title") if attachment else None,
                "attachment_mime": attachment.get("post_mime_type") if attachment else None,
                "attachment_guid": guid,
            }
        )
    return results


def write_updates_sql(records, sql_path: Path, project_types):
    lines = []
    project_set = {t.strip() for t in project_types.split(",") if t.strip()}

    def escape_sql(value: str) -> str:
        return value.replace("'", "''")

    for record in records:
        slug = record["slug"]
        image = record["featured_image"]
        post_type = record["post_type"]
        if not slug or not image:
            continue
        if post_type == "post":
            table = "news"
        elif post_type == "page":
            table = "pages"
        elif post_type in project_set:
            table = "projects"
        else:
            continue

        lines.append(
            f"UPDATE {table} SET featured_image = '{escape_sql(image)}' "
            f"WHERE slug = '{escape_sql(slug)}' AND (featured_image IS NULL OR featured_image = '');"
        )

    sql_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sql",
        default=r"db_init/riyan_nextjs.sql",
        help="Path to legacy WP SQL dump",
    )
    parser.add_argument(
        "--out",
        default=r"scripts/wp-media-map.json",
        help="Output JSON path",
    )
    parser.add_argument(
        "--sql-out",
        default=r"scripts/wp-media-updates.sql",
        help="Output SQL updates path",
    )
    parser.add_argument(
        "--project-types",
        default="project,liquid-portfolio,portfolio",
        help="Comma-separated WP post types to map to projects",
    )
    args = parser.parse_args()

    sql_path = Path(args.sql)
    if not sql_path.exists():
        raise SystemExit(f"SQL dump not found: {sql_path}")

    posts, attachments, thumbs, attached_files, post_type_counts = extract_wp_media(sql_path)
    featured = build_featured_map(posts, attachments, thumbs, attached_files)

    output = {
        "source": str(sql_path),
        "post_type_counts": post_type_counts,
        "featured_images": featured,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2), encoding="utf-8")

    if args.sql_out:
        sql_out_path = Path(args.sql_out)
        sql_out_path.parent.mkdir(parents=True, exist_ok=True)
        write_updates_sql(featured, sql_out_path, args.project_types)


if __name__ == "__main__":
    main()
