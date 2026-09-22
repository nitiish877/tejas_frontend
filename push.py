import subprocess
import sys
from pathlib import Path


# ============================================================
# CONFIG
# ============================================================

REPO_URL = "https://github.com/nitiish877/tejas_frontend.git"
BRANCH = "main"

COMMIT_MESSAGE = "Update project changes"


# ============================================================
# RUN COMMAND
# ============================================================

def run(command, allow_fail=False):

    print("\n>", " ".join(command))

    result = subprocess.run(
        command,
        text=True,
        capture_output=True
    )

    if result.stdout:
        print(result.stdout)

    if result.stderr:
        print(result.stderr)

    if result.returncode != 0 and not allow_fail:

        print("\n❌ Command failed.")
        sys.exit(result.returncode)

    return result


# ============================================================
# CHECK GIT
# ============================================================

try:

    subprocess.run(
        ["git", "--version"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

except FileNotFoundError:

    print(
        "\n❌ Git is not installed or Git is not in PATH."
    )

    sys.exit(1)


# ============================================================
# CURRENT FOLDER
# ============================================================

PROJECT_DIR = Path.cwd()

print("\n" + "=" * 60)
print("GITHUB AUTO PUSH")
print("=" * 60)

print(f"\nProject: {PROJECT_DIR}")


# ============================================================
# INITIALIZE GIT IF NEEDED
# ============================================================

git_folder = PROJECT_DIR / ".git"

if not git_folder.exists():

    print("\n📦 Git repository not found.")
    print("Initializing Git...")

    run([
        "git",
        "init"
    ])

else:

    print("\n✅ Git repository already initialized.")


# ============================================================
# CHECK / ADD REMOTE
# ============================================================

print("\n🔗 Checking GitHub remote...")

remote_result = subprocess.run(
    [
        "git",
        "remote",
        "get-url",
        "origin"
    ],
    capture_output=True,
    text=True
)

if remote_result.returncode != 0:

    print("Adding GitHub remote...")

    run([
        "git",
        "remote",
        "add",
        "origin",
        REPO_URL
    ])

else:

    current_remote = remote_result.stdout.strip()

    print(
        f"Existing remote: {current_remote}"
    )

    if current_remote != REPO_URL:

        print("Updating remote URL...")

        run([
            "git",
            "remote",
            "set-url",
            "origin",
            REPO_URL
        ])


# ============================================================
# SET MAIN BRANCH
# ============================================================

run([
    "git",
    "branch",
    "-M",
    BRANCH
])


# ============================================================
# SHOW CHANGES
# ============================================================

print("\n" + "=" * 60)
print("CURRENT CHANGES")
print("=" * 60)

run([
    "git",
    "status",
    "--short"
])


# ============================================================
# ADD EVERYTHING
# ============================================================

print("\n📦 Adding changes...")

run([
    "git",
    "add",
    "-A"
])


# ============================================================
# CHECK WHETHER COMMIT IS NEEDED
# ============================================================

commit_check = subprocess.run(
    [
        "git",
        "diff",
        "--cached",
        "--quiet"
    ]
)

if commit_check.returncode == 0:

    print("\nℹ️ No new changes to commit.")

else:

    # ========================================================
    # COMMIT
    # ========================================================

    print("\n📝 Creating commit...")

    run([
        "git",
        "commit",
        "-m",
        COMMIT_MESSAGE
    ])


# ============================================================
# PUSH
# ============================================================

print("\n" + "=" * 60)
print("PUSHING TO GITHUB")
print("=" * 60)

push_result = run(
    [
        "git",
        "push",
        "-u",
        "origin",
        BRANCH
    ],
    allow_fail=True
)


# ============================================================
# PUSH FAILED
# ============================================================

if push_result.returncode != 0:

    print("\n⚠️ Normal push failed.")

    print(
        "\nPossible reason:"
    )

    print(
        "GitHub already contains commits that are not "
        "present locally."
    )

    print(
        "\nFor safety, the script will NOT force push."
    )

    print(
        "\nIf this is genuinely a new/empty repository, "
        "you can resolve the remote history first."
    )

    sys.exit(1)


# ============================================================
# SUCCESS
# ============================================================

print("\n" + "=" * 60)
print("✅ SUCCESS")
print("=" * 60)

print(
    "\nYour changes have been pushed to GitHub."
)
