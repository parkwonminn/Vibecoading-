"""
checkpoint.py — Harness 프레임워크 직렬 처리 체크포인트 시스템

사용법:
  python checkpoint.py status           전체 진행 상황 출력
  python checkpoint.py list             페이지 목록 출력
  python checkpoint.py show <page_id>   페이지 상세 출력
  python checkpoint.py next             다음 실행 가능한 페이지 시작
  python checkpoint.py start <page_id>  특정 페이지 시작
  python checkpoint.py done [page_id]   페이지 완료 처리
  python checkpoint.py fail [page_id]   페이지 실패 처리
  python checkpoint.py check <page_id> <n>  완료 기준 n번 체크
  python checkpoint.py uncheck <page_id> <n>  체크 해제
  python checkpoint.py reset <page_id>  페이지 상태 초기화
  python checkpoint.py init             checkpoint.json 초기 생성
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

HARNESS_DIR = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(HARNESS_DIR, "pages")
CHECKPOINT_FILE = os.path.join(HARNESS_DIR, "checkpoint.json")

STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"

ICON = {
    STATUS_PENDING:     "⬜",
    STATUS_IN_PROGRESS: "🔄",
    STATUS_COMPLETED:   "✅",
    STATUS_FAILED:      "❌",
}


# ─── 파일 파싱 ────────────────────────────────────────────────────────────────

def parse_page_file(filepath: str) -> dict:
    """
    .page 파일을 파싱해 title, criteria(완료 기준 목록), dependencies(의존 페이지 목록)를 반환한다.
    """
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    title_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else os.path.basename(filepath)

    criteria = re.findall(r"- \[ \] (.+)", content)

    dep_section = re.search(r"## 의존성\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
    dependencies = []
    if dep_section:
        raw = dep_section.group(1).strip()
        if raw and raw.lower() not in ("없음 (시작점)", "없음", "-"):
            for token in re.findall(r"PAGE\s+(\d+)", raw, re.IGNORECASE):
                dependencies.append(f"page_{token.zfill(2)}")

    return {"title": title, "criteria": criteria, "dependencies": dependencies}


def discover_pages() -> list[str]:
    """pages/ 디렉토리에서 .page 파일을 이름 오름차순으로 반환한다."""
    if not os.path.isdir(PAGES_DIR):
        return []
    files = sorted(f for f in os.listdir(PAGES_DIR) if f.endswith(".page"))
    return [os.path.splitext(f)[0] for f in files]


# ─── checkpoint.json 관리 ────────────────────────────────────────────────────

def load_checkpoint() -> dict:
    if not os.path.exists(CHECKPOINT_FILE):
        return {}
    with open(CHECKPOINT_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_checkpoint(data: dict) -> None:
    data["updated_at"] = _now()
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_initial_checkpoint() -> dict:
    page_ids = discover_pages()
    pages: dict = {}
    for pid in page_ids:
        info = parse_page_file(os.path.join(PAGES_DIR, f"{pid}.page"))
        pages[pid] = {
            "title": info["title"],
            "dependencies": info["dependencies"],
            "criteria": info["criteria"],
            "criteria_checked": [False] * len(info["criteria"]),
            "status": STATUS_PENDING,
            "started_at": None,
            "completed_at": None,
        }
    return {
        "version": "1.0.0",
        "created_at": _now(),
        "updated_at": _now(),
        "pages": pages,
    }


def ensure_checkpoint() -> dict:
    data = load_checkpoint()
    if not data:
        data = build_initial_checkpoint()
        save_checkpoint(data)
        print("✨ checkpoint.json 초기화 완료")
    return data


def get_page(data: dict, page_id: str) -> dict | None:
    return data.get("pages", {}).get(page_id)


def current_in_progress(data: dict) -> str | None:
    for pid, info in data.get("pages", {}).items():
        if info["status"] == STATUS_IN_PROGRESS:
            return pid
    return None


def deps_satisfied(data: dict, page_id: str) -> bool:
    page = get_page(data, page_id)
    if not page:
        return False
    for dep_prefix in page.get("dependencies", []):
        matched = [
            pid for pid in data["pages"]
            if pid.startswith(dep_prefix)
        ]
        if not matched:
            return False
        if not all(data["pages"][m]["status"] == STATUS_COMPLETED for m in matched):
            return False
    return True


# ─── 명령어 구현 ──────────────────────────────────────────────────────────────

def cmd_init(_args):
    data = build_initial_checkpoint()
    save_checkpoint(data)
    print("✨ checkpoint.json 생성 완료")


def cmd_list(_args):
    data = ensure_checkpoint()
    pages = data.get("pages", {})
    print(f"\n{'ID':<38} {'상태':<14} 제목")
    print("─" * 80)
    for pid, info in pages.items():
        icon = ICON.get(info["status"], "?")
        print(f"  {pid:<36} {icon} {info['status']:<10}  {info['title']}")
    print()


def cmd_status(_args):
    data = ensure_checkpoint()
    pages = data.get("pages", {})
    total = len(pages)
    counts = {s: 0 for s in (STATUS_PENDING, STATUS_IN_PROGRESS, STATUS_COMPLETED, STATUS_FAILED)}
    for info in pages.values():
        counts[info["status"]] += 1

    print(f"\n── SnapCal Harness 진행 현황 ({'─'*30})")
    print(f"  전체 {total}페이지  |  "
          f"✅ 완료 {counts[STATUS_COMPLETED]}  "
          f"🔄 진행중 {counts[STATUS_IN_PROGRESS]}  "
          f"❌ 실패 {counts[STATUS_FAILED]}  "
          f"⬜ 대기 {counts[STATUS_PENDING]}")
    print()

    for pid, info in pages.items():
        icon = ICON.get(info["status"], "?")
        dep_str = ", ".join(info["dependencies"]) if info["dependencies"] else "없음"
        checked = sum(info.get("criteria_checked", []))
        total_c = len(info.get("criteria", []))
        print(f"  {icon} [{pid}]  {info['title']}")
        print(f"       의존성: {dep_str}  |  완료 기준: {checked}/{total_c}")
    print()


def cmd_show(args):
    if not args:
        print("사용법: python checkpoint.py show <page_id>")
        return
    data = ensure_checkpoint()
    pid = args[0]
    page = get_page(data, pid)
    if not page:
        print(f"❌ 페이지를 찾을 수 없습니다: {pid}")
        return

    icon = ICON.get(page["status"], "?")
    print(f"\n{icon} {page['title']}  [{pid}]")
    print(f"   상태: {page['status']}")
    print(f"   시작: {page['started_at'] or '-'}")
    print(f"   완료: {page['completed_at'] or '-'}")
    dep_str = ", ".join(page["dependencies"]) if page["dependencies"] else "없음"
    print(f"   의존성: {dep_str}")
    print(f"   완료 기준:")
    for i, (criterion, checked) in enumerate(
        zip(page["criteria"], page.get("criteria_checked", []))
    ):
        mark = "✅" if checked else "⬜"
        print(f"     [{i}] {mark}  {criterion}")
    print()


def cmd_next(_args):
    data = ensure_checkpoint()

    if current_in_progress(data):
        print(f"🔄 이미 진행 중인 페이지가 있습니다: {current_in_progress(data)}")
        return

    for pid, info in data["pages"].items():
        if info["status"] == STATUS_PENDING and deps_satisfied(data, pid):
            info["status"] = STATUS_IN_PROGRESS
            info["started_at"] = _now()
            save_checkpoint(data)
            print(f"🚀 시작: [{pid}]  {info['title']}")
            return

    print("⚠️  실행 가능한 대기 페이지가 없습니다. (의존성 미충족 또는 모두 완료)")


def cmd_start(args):
    if not args:
        print("사용법: python checkpoint.py start <page_id>")
        return
    data = ensure_checkpoint()
    pid = args[0]
    page = get_page(data, pid)
    if not page:
        print(f"❌ 페이지를 찾을 수 없습니다: {pid}")
        return
    if current_in_progress(data) and current_in_progress(data) != pid:
        print(f"⚠️  먼저 진행 중인 페이지를 완료/실패 처리하세요: {current_in_progress(data)}")
        return
    if not deps_satisfied(data, pid):
        print(f"⚠️  의존성이 충족되지 않았습니다: {page['dependencies']}")
        return
    page["status"] = STATUS_IN_PROGRESS
    page["started_at"] = _now()
    save_checkpoint(data)
    print(f"🚀 시작: [{pid}]  {page['title']}")


def _complete_page(data: dict, pid: str, status: str) -> None:
    page = get_page(data, pid)
    if not page:
        print(f"❌ 페이지를 찾을 수 없습니다: {pid}")
        return
    page["status"] = status
    page["completed_at"] = _now()
    save_checkpoint(data)
    icon = ICON[status]
    print(f"{icon} [{pid}] → {status}")


def cmd_done(args):
    data = ensure_checkpoint()
    pid = args[0] if args else current_in_progress(data)
    if not pid:
        print("⚠️  완료 처리할 페이지 ID를 지정하거나 진행 중인 페이지가 있어야 합니다.")
        return
    _complete_page(data, pid, STATUS_COMPLETED)


def cmd_fail(args):
    data = ensure_checkpoint()
    pid = args[0] if args else current_in_progress(data)
    if not pid:
        print("⚠️  실패 처리할 페이지 ID를 지정하거나 진행 중인 페이지가 있어야 합니다.")
        return
    _complete_page(data, pid, STATUS_FAILED)


def cmd_check(args):
    if len(args) < 2:
        print("사용법: python checkpoint.py check <page_id> <n>")
        return
    data = ensure_checkpoint()
    pid, idx = args[0], int(args[1])
    page = get_page(data, pid)
    if not page:
        print(f"❌ 페이지를 찾을 수 없습니다: {pid}")
        return
    if idx >= len(page["criteria_checked"]):
        print(f"❌ 인덱스 범위 초과 (0 ~ {len(page['criteria_checked']) - 1})")
        return
    page["criteria_checked"][idx] = True
    save_checkpoint(data)
    print(f"✅ 체크: [{pid}] 기준 {idx} — {page['criteria'][idx]}")


def cmd_uncheck(args):
    if len(args) < 2:
        print("사용법: python checkpoint.py uncheck <page_id> <n>")
        return
    data = ensure_checkpoint()
    pid, idx = args[0], int(args[1])
    page = get_page(data, pid)
    if not page:
        print(f"❌ 페이지를 찾을 수 없습니다: {pid}")
        return
    page["criteria_checked"][idx] = False
    save_checkpoint(data)
    print(f"⬜ 체크 해제: [{pid}] 기준 {idx} — {page['criteria'][idx]}")


def cmd_reset(args):
    if not args:
        print("사용법: python checkpoint.py reset <page_id>")
        return
    data = ensure_checkpoint()
    pid = args[0]
    page = get_page(data, pid)
    if not page:
        print(f"❌ 페이지를 찾을 수 없습니다: {pid}")
        return
    page["status"] = STATUS_PENDING
    page["started_at"] = None
    page["completed_at"] = None
    page["criteria_checked"] = [False] * len(page["criteria"])
    save_checkpoint(data)
    print(f"♻️  초기화: [{pid}] → pending")


# ─── 진입점 ───────────────────────────────────────────────────────────────────

COMMANDS = {
    "init":    cmd_init,
    "list":    cmd_list,
    "status":  cmd_status,
    "show":    cmd_show,
    "next":    cmd_next,
    "start":   cmd_start,
    "done":    cmd_done,
    "fail":    cmd_fail,
    "check":   cmd_check,
    "uncheck": cmd_uncheck,
    "reset":   cmd_reset,
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(0)
    COMMANDS[sys.argv[1]](sys.argv[2:])
