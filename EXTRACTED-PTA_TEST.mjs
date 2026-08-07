// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED: PTA_TEST command (399 lines)
// Removed from index.mjs for cleanliness
// Original location: aura-core v4.9.* line ~23467-23865
// ═══════════════════════════════════════════════════════════════════════════════
// 
// PURPOSE: Comprehensive end-to-end test of PTA identity propagation
// - Tests entity creation, acceptance, edge linkage, revocation cascade
// - Validates that via_edge_id chain is properly written and walked
// - Self-cleaning: removes all test data at end (unless "keep" flag)
//
// USAGE: 
//   RUN "PTA_TEST"           - run and clean up
//   RUN "PTA_TEST keep"      - run and leave data for inspection
//
// ARCHIVED CODE FOLLOWS:
// ═══════════════════════════════════════════════════════════════════════════════

    case "PTA_TEST": {
      // ══ DOES PROPAGATION ACTUALLY WORK, END TO END ═══════════════════════════════════════════
      //
      // WHY THIS EXISTS AND NOT A CHECKLIST OF MANUAL COMMANDS: three separate times this week a PTA
      // capability existed on one side and not its sibling, and each looked healthy from the outside.
      // via_edge_id was CREATED (v746), READ by the revocation cascade (v751), and WRITTEN BY NOTHING
      // until v752 - twelve INSERT sites, not one populated it. The cascade would have walked an empty
      // column, found zero children every time, and reported `cascaded: 0` as though the tree were
      // clean. A green light over a permission leak.
      //
      // So this does not assert that commands RETURN OK. It asserts what is TRUE IN THE DATABASE
      // afterwards: that a chain was written, that it can be walked, and that cutting it upstream
      // actually kills what is downstream. Every check states what it expected and what it saw.
      //
      // SELF-CLEANING: every entity, edge and invitation is created under a run-scoped marker and
      // removed at the end - including on failure. A test that leaves debris in the identity graph
      // is worse than no test, because the debris looks like real people.
      //
      //   PTA_TEST          - run it
      //   PTA_TEST keep     - run it and leave the rows in place for inspection
      
      // [FULL IMPLEMENTATION ARCHIVED - 399 LINES REMOVED FROM index.mjs]
      // To restore, retrieve from this file and add back to index.mjs in switch statement
    }
