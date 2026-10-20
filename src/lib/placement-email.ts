import "server-only";

/**
 * HTML email template for the placement purchase receipt.
 * Plain string templates (no react-email render dependency) so it can be sent
 * from a server action without a build-time email render step.
 */

export interface PlacementReceiptDetails {
  studentEmail: string;
  company: string;
  role: string;
  listingType: string;
  payRate: string | null;
  receiptNumber: string;
  amountPaid: string;
  date: string;
  dashboardUrl: string;
}

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 0;color:#94A3B8;font-size:13px;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:10px 0 10px 16px;color:#F1F5F9;font-size:13px;font-weight:600;text-align:right;vertical-align:top;">${value}</td>
  </tr>`;

export function placementReceiptHtml(d: PlacementReceiptDetails): string {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;padding:0;background-color:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="background-color:#0A1628;padding:40px 16px;">
      <div style="max-width:560px;margin:0 auto;">

        <!-- Header -->
        <div style="text-align:center;padding-bottom:24px;">
          <div style="font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
            Beyond<span style="color:#3B82F6;">Intern</span>
          </div>
          <p style="margin:8px 0 0;color:#94A3B8;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
            Official Enrolment &amp; Purchase Receipt
          </p>
        </div>

        <!-- Card -->
        <div style="background-color:#111D35;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;overflow:hidden;">

          <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#2563EB);font-size:26px;color:#fff;">&#10003;</div>
            <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;color:#FFFFFF;">
              Payment &amp; Enrolment Confirmed
            </h1>
            <p style="margin:0;font-size:14px;color:#CBD5E1;line-height:1.6;">
              Your course and placement support purchase is successful, and your
              placement slot has been assigned to your account.
            </p>
          </div>

          <!-- Receipt summary -->
          <div style="margin:24px 0;background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:8px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row("Receipt No.", d.receiptNumber)}
              ${row("Date", d.date)}
              ${row("Student Email", d.studentEmail)}
              ${row("Assigned Placement", `${d.role} at ${d.company}`)}
              ${row("Type", d.listingType)}
              ${d.payRate ? row("Pay Rate", d.payRate) : ""}
              <tr>
                <td style="padding:12px 0;color:#94A3B8;font-size:13px;border-top:1px solid rgba(255,255,255,0.08);">Support Fee</td>
                <td style="padding:12px 0 12px 16px;color:#10B981;font-size:14px;font-weight:700;text-align:right;border-top:1px solid rgba(255,255,255,0.08);">Paid / Confirmed - ${d.amountPaid}</td>
              </tr>
            </table>
          </div>

          <!-- Action required -->
          <div style="background:linear-gradient(135deg,rgba(59,130,246,0.14),rgba(245,158,11,0.10));border:1px solid rgba(96,165,250,0.25);border-radius:14px;padding:20px;margin-bottom:26px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#60A5FA;text-transform:uppercase;letter-spacing:1.5px;">Action Required</p>
            <p style="margin:0;font-size:14px;color:#E2E8F0;line-height:1.6;">
              Log into your dashboard and upload your updated CV so the placement
              team can begin processing your application with ${d.company}.
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${d.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#2563EB);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:14px 28px;border-radius:999px;">
              Go to Dashboard &amp; Upload CV &rarr;
            </a>
          </div>

          <p style="margin:26px 0 0;font-size:12px;color:#64748B;line-height:1.6;text-align:center;">
            Keep this email for your records. If you did not expect this
            confirmation, reply to this email or contact us at
            <a href="mailto:info@beyondintern.com" style="color:#60A5FA;text-decoration:none;">info@beyondintern.com</a>.
          </p>
        </div>

        <!-- Footer -->
        <p style="margin:24px 0 0;font-size:11px;color:#475569;text-align:center;line-height:1.6;">
          Beyond Intern &middot; Premium EdTech &amp; Placement Platform<br>
          This is an automated receipt - please do not reply directly.
        </p>
      </div>
    </div>
  </body>
</html>`;
}
