import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-145px)] overflow-y-auto bg-white">
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-indigo-600">
              DyeFlow
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Terms &amp; Conditions
            </h1>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </Link>
        </div>

        <div className="space-y-6 text-sm leading-7 text-slate-600">
          <p>
            DyeFlow provides operational tools for dyeing-factory job tracking and
            invoicing. You are responsible for the accuracy of customer, tax, and
            banking information entered into your workspace and for reviewing invoices
            before issuing them.
          </p>
          <p>
            Keep your credentials private. Use the application only for authorized
            business activity and contact your administrator if you suspect unauthorized
            access.
          </p>
          <p>
            Tax rates and invoice formats should be reviewed with your qualified Indian
            tax advisor before issuing statutory documents.
          </p>
          <h2 className="pt-4 text-lg font-semibold text-slate-900">
            Account responsibility
          </h2>
          <p>
            Keep company profile, GST, bank, customer, and service information current.
            Do not share account credentials or enter information belonging to another
            business without authorization.
          </p>
          <h2 className="pt-4 text-lg font-semibold text-slate-900">
            Invoice responsibility
          </h2>
          <p>
            DyeFlow helps prepare job-work invoice information but does not replace
            professional tax advice. Confirm SAC classification, GST rate, place of
            supply, customer details, and totals before issuing an invoice.
          </p>
          <h2 className="pt-4 text-lg font-semibold text-slate-900">
            Data and security
          </h2>
          <p>
            Use strong passwords, sign out on shared devices, and report suspected
            unauthorized access promptly. Access to company data is restricted by the
            authenticated workspace.
          </p>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/login"
            className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
