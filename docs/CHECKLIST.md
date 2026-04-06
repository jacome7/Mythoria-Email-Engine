# Checklist

## Before Push

- [ ] `src/kb.json` changes reviewed
- [ ] `src/Config.js` changes reviewed
- [ ] `npm run sync:kb` run locally
- [ ] No secrets added to source files

## Before First Production Run

- [ ] `npm run push` completed successfully
- [ ] Sheet tabs initialized
- [ ] Gmail labels initialized
- [ ] Script Properties configured
- [ ] `Tests -> Validate Setup` passes
- [ ] Recommended trigger installed

## Production Verification

- [ ] `Runs_Log` receives new rows
- [ ] `status` is usually `completed`, not `locked` or `error`
- [ ] bounce messages appear in `Bounces`
- [ ] DMARC reports update `DMARC_Health`
- [ ] `Errors` stays low and understandable

## Ongoing Maintenance

- [ ] Edit `src/kb.json` for KB changes
- [ ] Run `npm run push` after KB or config changes
- [ ] Rotate Script Properties outside source control
- [ ] Review trigger status after deployment changes
