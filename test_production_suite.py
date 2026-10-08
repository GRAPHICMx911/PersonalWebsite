#!/usr/bin/env python3
"""
=============================================================
MASTER PRODUCTION VERIFICATION SUITE — ALL MODULES E2E
=============================================================
Runs automated end-to-end tests across the entire platform:
- Modules 1–4: Core Architecture, Auth, Projects, Skills, Career
- Module 5: Design Portfolio & UX/UI Case Studies CMS
- Module 6: Technical Blog & Knowledge Publishing CMS
- Module 7: Contact Messages & Client Inquiries CMS
- Module 8: Social Links & Media Profiles CMS
- Module 9: Website Settings, Profile Metadata & SEO CMS
- System Security Headers & Database Health Check
=============================================================
"""

import sys
import subprocess
from datetime import datetime

TEST_SUITES = [
    ("Modules 1–4 (Core, Projects, Skills, Career)", "test_modules1_to_4_e2e.py"),
    ("Module 5 (Design Portfolio & UX/UI CMS)", "test_module5_e2e.py"),
    ("Module 6 (Technical Blog CMS)", "test_module6_e2e.py"),
    ("Module 7 (Contact Inquiries CMS)", "test_module7_e2e.py"),
    ("Module 8 (Social Links CMS)", "test_module8_e2e.py"),
    ("Module 9 (Website Settings & SEO CMS)", "test_module9_e2e.py"),
]

def run_suite():
    print("=" * 72)
    print("PERSONAL GLOBAL WEBSITE & CMS — MASTER PRODUCTION VERIFICATION SUITE")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 72)

    results = []

    for name, script in TEST_SUITES:
        print(f"\n>> Executing Suite: {name} ({script})...")
        proc = subprocess.run(
            [sys.executable, script],
            capture_output=True,
            text=True
        )
        passed = proc.returncode == 0
        results.append((name, script, passed, proc.stdout, proc.stderr))
        status_label = "[PASSED 100%]" if passed else "[FAILED]"
        print(f"   Status: {status_label}")
        if not passed:
            print("   Error details:\n" + proc.stdout + "\n" + proc.stderr)

    print("\n" + "=" * 72)
    print("GLOBAL TEST RESULTS SUMMARY")
    print("=" * 72)

    all_passed = True
    for name, script, passed, _, _ in results:
        status_sym = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{status_sym:7} |  {name:48}  ({script})")

    print("=" * 72)
    if all_passed:
        print(">>> ALL TEST SUITES PASSED! Platform is 100% production-ready. <<<")
    else:
        print(">>> WARNING: Some test suites failed. Review logs above. <<<")
    print("=" * 72)

    return all_passed

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
