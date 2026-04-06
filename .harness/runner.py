#!/usr/bin/env python3
"""
runner.py — SnapCal Harness 자율 수행 오케스트레이터

사용법:
  python runner.py               현재 상태 요약 + 다음 태스크 정보 출력
  python runner.py status        전체 진행 현황 출력
  python runner.py next          다음 태스크 시작 처리 + 스펙 전체 출력
  python runner.py done          현재 태스크 완료 처리 + 다음 스펙 자동 출력
  python runner.py fail          현재 태스크 실패 처리
  python runner.py show <page>   특정 페이지 스펙 출력
  python runner.py run           자율 수행 모드 진입 (Agent 진입점)

자율 수행 루프:
  1. python runner.py next    -> 스펙 읽고 구현
  2. python runner.py done    -> 완료 처리 + 다음 스펙 자동 출력
  3. 모든 페이지 완료까지 반복
"""

import sys
from pathlib import Path

# checkpoint.py 를 같은 디렉토리에서 임포트
sys.path.insert(0, str(Path(__file__).parent))

from checkpoint import (
    ensure_checkpoint,
    load_checkpoint,
    save_checkpoint,
    current_in_progress,
    deps_satisfied,
    get_page,
    STATUS_PENDING,
    STATUS_IN_PROGRESS,
    STATUS_COMPLETED,
    STATUS_FAILED,
    ICON,
    _now,
    PAGES_DIR,
)

DIVIDER = "=" * 60
THIN_DIV = "-" * 60


# ── .page 파일 읽기 ────────────────────────────────────────────────────────────

def read_page_spec(page_id: str) -> str:
    page_file = Path(PAGES_DIR) / f"{page_id}.page"
    if not page_file.exists():
        return f"[WARNING] 스펙 파일 없음: {page_file}"
    return page_file.read_text(encoding="utf-8")


def count_pages(data: dict) -> dict:
    counts = {s: 0 for s in (STATUS_PENDING, STATUS_IN_PROGRESS, STATUS_COMPLETED, STATUS_FAILED)}
    for info in data.get("pages", {}).values():
        counts[info["status"]] += 1
    return counts


# ── 출력 헬퍼 ─────────────────────────────────────────────────────────────────

def print_header(title: str) -> None:
    print(f"\n{DIVIDER}")
    print(f"  SnapCal Harness -- {title}")
    print(DIVIDER)


def print_progress_bar(data: dict) -> None:
    pages = data.get("pages", {})
    total = len(pages)
    counts = count_pages(data)
    done = counts[STATUS_COMPLETED]
    pct = int(done / total * 100) if total else 0
    bar_len = 30
    filled = int(bar_len * done / total) if total else 0
    bar = "#" * filled + "." * (bar_len - filled)
    print(f"\n  Progress  [{bar}] {done}/{total}  ({pct}%)")
    print(
        f"  Complete={counts[STATUS_COMPLETED]}  "
        f"InProgress={counts[STATUS_IN_PROGRESS]}  "
        f"Failed={counts[STATUS_FAILED]}  "
        f"Pending={counts[STATUS_PENDING]}\n"
    )


def print_page_list(data: dict) -> None:
    for pid, info in data.get("pages", {}).items():
        icon = ICON.get(info["status"], "?")
        dep_str = ", ".join(info["dependencies"]) if info["dependencies"] else "없음"
        checked = sum(info.get("criteria_checked", []))
        total_c = len(info.get("criteria", []))
        marker = " <-- 현재 진행중" if info["status"] == STATUS_IN_PROGRESS else ""
        print(f"  {icon} {info['title']}{marker}")
        print(f"       deps: {dep_str}  |  criteria: {checked}/{total_c}  [{pid}]")


def print_spec(page_id: str, info: dict, data: dict) -> None:
    pages = list(data["pages"].keys())
    idx = pages.index(page_id) + 1 if page_id in pages else "?"
    total = len(pages)

    print(f"\n{DIVIDER}")
    print(f"  [TASK {idx}/{total}]  {info['title']}")
    print(f"  ID: {page_id}")
    print(DIVIDER)

    spec = read_page_spec(page_id)
    print(spec)

    print(THIN_DIV)
    print("  완료 기준 체크리스트:")
    criteria = info.get("criteria", [])
    checked_list = info.get("criteria_checked", [False] * len(criteria))
    for i, (criterion, checked) in enumerate(zip(criteria, checked_list)):
        mark = "[v]" if checked else "[ ]"
        print(f"    [{i}] {mark}  {criterion}")

    print(f"\n{DIVIDER}")
    print("  구현 완료 후 실행:")
    print("    python .harness/runner.py done")
    print(DIVIDER)


# ── 명령어 구현 ───────────────────────────────────────────────────────────────

def cmd_status(_args: list) -> None:
    data = ensure_checkpoint()
    print_header("진행 현황")
    print_progress_bar(data)
    print_page_list(data)
    print()


def cmd_next(_args: list) -> None:
    data = ensure_checkpoint()

    in_prog = current_in_progress(data)
    if in_prog:
        info = get_page(data, in_prog)
        print(f"\n[WARNING] 이미 진행 중인 태스크가 있습니다: [{in_prog}]")
        print("   완료 처리 후 다음으로 진행하세요:")
        print("   python .harness/runner.py done\n")
        return

    for pid, info in data["pages"].items():
        if info["status"] == STATUS_PENDING and deps_satisfied(data, pid):
            info["status"] = STATUS_IN_PROGRESS
            info["started_at"] = _now()
            save_checkpoint(data)
            print_spec(pid, info, data)
            return

    all_done = all(
        info["status"] == STATUS_COMPLETED
        for info in data["pages"].values()
    )
    if all_done:
        print("\n[DONE] 모든 페이지 구현 완료! SnapCal MVP 빌드 완성.\n")
    else:
        print("\n[WARNING] 실행 가능한 대기 태스크가 없습니다.")
        print("   의존성 미충족 또는 실패 태스크 존재.")
        print("   python .harness/runner.py status  로 확인하세요.\n")


def cmd_done(args: list) -> None:
    data = ensure_checkpoint()

    pid = args[0] if args else current_in_progress(data)
    if not pid:
        print("\n[WARNING] 완료 처리할 태스크가 없습니다.")
        print("   python .harness/runner.py next  를 먼저 실행하세요.\n")
        return

    page = get_page(data, pid)
    if not page:
        print(f"\n[ERROR] 페이지를 찾을 수 없습니다: {pid}\n")
        return

    page["status"] = STATUS_COMPLETED
    page["completed_at"] = _now()
    save_checkpoint(data)
    print(f"\n[DONE] 완료: [{pid}]  {page['title']}")

    # 다음 태스크 자동 탐색
    print(f"\n{THIN_DIV}")
    print("  다음 태스크를 탐색합니다...\n")

    for next_pid, next_info in data["pages"].items():
        if next_info["status"] == STATUS_PENDING and deps_satisfied(data, next_pid):
            next_info["status"] = STATUS_IN_PROGRESS
            next_info["started_at"] = _now()
            save_checkpoint(data)
            print_spec(next_pid, next_info, data)
            return

    all_done = all(
        info["status"] == STATUS_COMPLETED
        for info in data["pages"].values()
    )
    if all_done:
        print("[DONE] 모든 페이지 구현 완료! SnapCal MVP 빌드 완성.\n")
        cmd_status([])
    else:
        print("[INFO] 대기 중인 태스크가 있지만 의존성이 아직 충족되지 않았습니다.")
        print("   python .harness/runner.py status  로 상태를 확인하세요.\n")


def cmd_fail(args: list) -> None:
    data = ensure_checkpoint()
    pid = args[0] if args else current_in_progress(data)
    if not pid:
        print("\n[WARNING] 실패 처리할 태스크가 없습니다.\n")
        return
    page = get_page(data, pid)
    if not page:
        print(f"\n[ERROR] 페이지를 찾을 수 없습니다: {pid}\n")
        return
    page["status"] = STATUS_FAILED
    page["completed_at"] = _now()
    save_checkpoint(data)
    print(f"\n[FAIL] 실패 처리: [{pid}]  {page['title']}")
    print(f"   재시도: python .harness/checkpoint.py reset {pid}\n")


def cmd_show(args: list) -> None:
    if not args:
        print("\n사용법: python runner.py show <page_id>\n")
        return
    data = ensure_checkpoint()
    pid = args[0]
    info = get_page(data, pid)
    if not info:
        print(f"\n[ERROR] 페이지를 찾을 수 없습니다: {pid}\n")
        return
    print_spec(pid, info, data)


def cmd_run(_args: list) -> None:
    data = ensure_checkpoint()
    counts = count_pages(data)

    print_header("자율 수행 모드 (Plan-and-Build)")
    print_progress_bar(data)

    in_prog = current_in_progress(data)
    if in_prog:
        info = get_page(data, in_prog)
        print(f"  [RESUME] 진행 중인 태스크: [{in_prog}]  {info['title']}")
        print(f"  구현 완료 후: python .harness/runner.py done\n")
        print_spec(in_prog, info, data)
        return

    total = len(data.get("pages", {}))
    if counts[STATUS_COMPLETED] == total:
        print("  [DONE] 모든 태스크 완료! SnapCal MVP 빌드 완성.\n")
        return

    print("  [LOOP] 자율 수행 순서:")
    print("     1. python .harness/runner.py next   -> 스펙 읽고 구현")
    print("     2. python .harness/runner.py done   -> 완료 처리 + 다음 스펙 자동 출력")
    print("     3. 모든 페이지 완료까지 반복\n")
    print(THIN_DIV)
    print("  첫 번째 태스크를 지금 시작합니다...\n")
    cmd_next([])


def cmd_default(_args: list) -> None:
    data = ensure_checkpoint()
    print_header("상태 요약")
    print_progress_bar(data)

    in_prog = current_in_progress(data)
    if in_prog:
        info = get_page(data, in_prog)
        print(f"  진행 중: [{in_prog}]  {info['title']}")
        print(f"\n  스펙 확인: python .harness/runner.py show {in_prog}")
        print(f"  완료 처리: python .harness/runner.py done\n")
    else:
        for pid, info in data["pages"].items():
            if info["status"] == STATUS_PENDING and deps_satisfied(data, pid):
                print(f"  [NEXT] {info['title']}  [{pid}]")
                print(f"\n  시작하려면: python .harness/runner.py next\n")
                break
        else:
            all_done = all(
                i["status"] == STATUS_COMPLETED for i in data["pages"].values()
            )
            if all_done:
                print("  [DONE] 모든 태스크 완료!\n")
            else:
                print("  [WARNING] 의존성 미충족 태스크가 있습니다.\n")

    print_page_list(data)
    print()


# ── 진입점 ────────────────────────────────────────────────────────────────────

COMMANDS = {
    "status": cmd_status,
    "next":   cmd_next,
    "done":   cmd_done,
    "fail":   cmd_fail,
    "show":   cmd_show,
    "run":    cmd_run,
}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        cmd_default(sys.argv[1:])
    elif sys.argv[1] in COMMANDS:
        COMMANDS[sys.argv[1]](sys.argv[2:])
    else:
        print(__doc__)
