# Admin photo entries

The `/admin` page lists one row per recce photo/specification entry across projects. It includes store ID and name, collateral, brand, recce upload time, installation upload time, expiry days, removal dates, payment, and lifecycle status. Administrators can edit store details, collateral, brand, and payment. Existing entries with no payment value display **Not recorded**.

New web recce uploads accept store ID and brand. The photos sheet automatically appends `store_id`, `brand_name`, and `payment_status` columns without changing existing column positions. No manual spreadsheet migration is required.

## Removal and history

An installation remains active through its removal date in Asia/Kolkata. After that date, repository reads exclude its mapping. The original installation file and mapping history remain stored; no S3 file is deleted. Expired files cannot be linked again. Entries with only expired installations display **Removed**; entries with an active installation display **Installed**; entries without installation history display **Recce**.

Expiry days are calculated per entry from its next active removal date, or its most recent removal date when all installations have expired. Missing removal dates have no countdown. Installation timestamps represent file upload times. Status is derived on reads, so no scheduled job is required. Open repository and admin views refresh every minute.

## Deployment and verification

Deploy `wecapurred_rr` first, then `norrvex_bucket`, to enable filtering in the shared repository API and refresh behavior in Bucket. Both apps retain their existing environment configuration.

Tests in `norrvex_bucket` cover the IST expiry boundary, retained files/history, repository ownership filtering, and admin endpoint permissions and validation. Run `npm test`, builds in both apps, and `npm run test:production` in Bucket. These checks use fixtures and do not modify production data.
