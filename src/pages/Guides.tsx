import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  readTime: string;
}

const GUIDES: GuideMeta[] = [
  {
    slug: 'analyze-csv-online',
    title: 'How to Analyze a CSV File Online for Free (No Signup)',
    description:
      'Upload any CSV file and get instant summaries, statistics, and charts — right in your browser, without installing anything or creating an account.',
    readTime: '4 min read',
  },
  {
    slug: 'excel-charts',
    title: 'How to Turn Excel Data into Beautiful Charts in Minutes',
    description:
      'From raw spreadsheet to presentation-ready charts: the fastest way to visualize Excel data online and export it as images or PDF.',
    readTime: '5 min read',
  },
  {
    slug: 'csv-vs-excel',
    title: 'CSV vs Excel: Which Format Should You Use for Data Analysis?',
    description:
      'The honest breakdown of when a simple CSV beats a full Excel workbook — and when it does not.',
    readTime: '4 min read',
  },
  {
    slug: 'clean-data-online',
    title: 'How to Clean Messy Data Online for Free (No Signup)',
    description:
      'Duplicate rows, missing values, inconsistent labels — fix the most common data quality problems in minutes, right in your browser.',
    readTime: '5 min read',
  },
  {
    slug: 'remove-duplicates',
    title: 'How to Remove Duplicates from a CSV or Excel File Online',
    description:
      'Double-counted orders and repeated customers skew every total. Find and remove duplicate rows fast — free, no signup.',
    readTime: '3 min read',
  },
  {
    slug: 'correlation-analysis',
    title: 'Correlation Analysis Online: Find Hidden Relationships in Your Data',
    description:
      'Does ad spend drive sales? Learn how to run correlation analysis in your browser and read the results like an analyst.',
    readTime: '5 min read',
  },
  {
    slug: 'pivot-table-online',
    title: 'How to Make a Pivot Table Online Without Excel',
    description:
      'Summarize thousands of rows into clean totals by category — no Excel, no formulas. Build pivot tables free in your browser.',
    readTime: '4 min read',
  },
];

function Cta() {
  return (
    <div className="mt-10 rounded-2xl bg-blue-600 p-8 text-center text-white">
      <h3 className="text-2xl font-bold mb-2">Try it on your own data — free</h3>
      <p className="text-blue-100 mb-6 text-sm">
        Upload a CSV or Excel file and get instant analysis, charts, and a PDF report. No signup required.
      </p>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition"
      >
        Open the free analyzer <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function ArticleShell({ guide, children }: { guide: GuideMeta; children: React.ReactNode }) {
  const idx = GUIDES.findIndex((g) => g.slug === guide.slug);
  const prev = GUIDES[idx - 1];
  const next = GUIDES[idx + 1];
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
      <Navbar />
      <main className="flex-1 py-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/guides" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="w-4 h-4" /> All guides
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{guide.title}</h1>
          <p className="text-gray-500 text-sm mb-8 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {guide.readTime} · DataInsight Pro guides
          </p>
          <div className="prose-custom space-y-5 text-gray-700 leading-relaxed text-[15px]">{children}</div>
          <Cta />
          <nav className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prev ? (
              <Link to={`/guides/${prev.slug}`} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-400 transition">
                <span className="text-xs text-gray-400 uppercase">Previous</span>
                <p className="font-semibold text-sm mt-1">{prev.title}</p>
              </Link>
            ) : <span />}
            {next ? (
              <Link to={`/guides/${next.slug}`} className="rounded-xl border border-gray-200 bg-white p-4 text-right hover:border-blue-400 transition">
                <span className="text-xs text-gray-400 uppercase">Next</span>
                <p className="font-semibold text-sm mt-1">{next.title}</p>
              </Link>
            ) : <span />}
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-bold text-gray-900 pt-4">{children}</h2>
);
const UL = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((it) => (
      <li key={it} className="flex items-start gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);
const STEPS = ({ steps }: { steps: { t: string; d: string }[] }) => (
  <ol className="space-y-4">
    {steps.map((s, i) => (
      <li key={s.t} className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
          {i + 1}
        </span>
        <div>
          <p className="font-semibold text-gray-900">{s.t}</p>
          <p className="text-sm">{s.d}</p>
        </div>
      </li>
    ))}
  </ol>
);

function CsvGuide() {
  const guide = GUIDES[0];
  return (
    <ArticleShell guide={guide}>
      <p>
        CSV files are everywhere — exports from Shopify, Google Analytics, your bank, or a survey tool.
        But staring at 10,000 rows in a text file tells you nothing. Here is how to turn any CSV into
        clear answers in under two minutes, free, without installing software or creating an account.
      </p>
      <H2>Step-by-step: analyze a CSV online</H2>
      <STEPS
        steps={[
          { t: 'Open the free analyzer', d: 'Go to the DataInsight Pro workspace. Everything runs in your browser — your file never leaves your computer.' },
          { t: 'Drop in your CSV file', d: 'Drag and drop the file (or click to browse). Files with thousands of rows load in seconds.' },
          { t: 'Read the automatic summary', d: 'You instantly get row/column counts, data types, missing values, and per-column statistics like averages, minimums, and maximums.' },
          { t: 'Explore with charts', d: 'One click turns any column into a bar, line, or pie chart. Spot trends and outliers visually instead of squinting at cells.' },
          { t: 'Export your results', d: 'Download a clean PDF report or export charts as images for your presentation or boss.' },
        ]}
      />
      <H2>What to look for in your data</H2>
      <UL
        items={[
          'Missing values — empty cells that can silently break averages and totals.',
          'Duplicates — the same order, customer, or transaction counted twice.',
          'Outliers — one extreme value (a $50,000 refund?) skewing your whole average.',
          'Distributions — is your data clustered around one value or spread out?',
        ]}
      />
      <H2>Tips for tricky CSV files</H2>
      <p>
        If your file uses semicolons instead of commas (common in European exports) or a different
        text encoding, use the import options to set the delimiter and encoding before analyzing.
        Always check the detected column types — a "date" read as text will not sort correctly.
      </p>
      <p>
        Want to go further? Learn <Link to="/guides/excel-charts" className="text-blue-600 hover:underline">how to turn Excel data into charts</Link> next.
      </p>
    </ArticleShell>
  );
}

function ExcelChartsGuide() {
  const guide = GUIDES[1];
  return (
    <ArticleShell guide={guide}>
      <p>
        A chart is worth a thousand spreadsheet rows. Whether it is monthly sales, survey responses,
        or website traffic, here is the fastest path from an Excel file to charts you can proudly
        put in a slide deck.
      </p>
      <H2>The 4-minute workflow</H2>
      <STEPS
        steps={[
          { t: 'Upload your Excel file', d: 'Drop your .xlsx or .xls file into the free DataInsight Pro workspace. Multiple sheets are supported.' },
          { t: 'Pick your columns', d: 'Choose what goes on each axis — for example months on the X axis and revenue on the Y axis.' },
          { t: 'Choose the right chart type', d: 'Trends over time → line chart. Comparisons between categories → bar chart. Parts of a whole → pie or donut chart.' },
          { t: 'Export and share', d: 'Download charts as PNG images or bundle everything into a one-click PDF report.' },
        ]}
      />
      <H2>Choosing the right chart</H2>
      <UL
        items={[
          'Line chart — best for anything that changes over time (sales, traffic, signups).',
          'Bar chart — best for comparing categories (revenue by product, votes by option).',
          'Pie / donut — best when you want to show shares of a total (market share, budget split).',
          'Avoid 3D effects and rainbow colors — clean and simple reads as professional.',
        ]}
      />
      <H2>Common mistakes to avoid</H2>
      <p>
        The biggest one: charting raw data before cleaning it. Remove empty rows, fix inconsistent
        labels ("USA" vs "U.S.A." vs "United States"), and make sure numbers are actually stored as
        numbers, not text. Five minutes of cleaning saves hours of confusing charts.
      </p>
      <p>
        Curious about formats? Read <Link to="/guides/csv-vs-excel" className="text-blue-600 hover:underline">CSV vs Excel: which should you use?</Link>
      </p>
    </ArticleShell>
  );
}

function CsvVsExcelGuide() {
  const guide = GUIDES[2];
  return (
    <ArticleShell guide={guide}>
      <p>
        Two formats dominate the data world, and picking the wrong one causes real headaches.
        Here is the no-nonsense comparison.
      </p>
      <H2>CSV: simple and universal</H2>
      <UL
        items={[
          'Plain text — opens anywhere, works with every tool and programming language.',
          'Tiny file sizes and fast to process, even with millions of rows.',
          'Perfect for moving data between systems (exports, imports, backups).',
          'Limitation: one sheet only, no formatting, no formulas.',
        ]}
      />
      <H2>Excel: powerful but heavier</H2>
      <UL
        items={[
          'Multiple sheets, formatting, formulas, and pivot tables in one file.',
          'The standard for business reports people actually read.',
          'Downsides: larger files, slower with big data, and formatting can hide data problems.',
        ]}
      />
      <H2>So which should you use?</H2>
      <p>
        <strong>Use CSV</strong> when moving data between tools, working with large datasets, or
        feeding data into analysis software. <strong>Use Excel</strong> when humans need to read,
        present, or collaborate on the data. Good news: <Link to="/app" className="text-blue-600 hover:underline">DataInsight Pro</Link> handles
        both — upload either format and get the same instant analysis, charts, and PDF reports.
      </p>
      <p>
        Ready to try? Start with <Link to="/guides/analyze-csv-online" className="text-blue-600 hover:underline">analyzing a CSV file online</Link>.
      </p>
    </ArticleShell>
  );
}

function CleanDataGuide() {
  const guide = GUIDES[3];
  return (
    <ArticleShell guide={guide}>
      <p>
        Every dataset is dirty. Exports come with blank cells, double-counted rows, and the same
        country written three different ways. Analyzing messy data gives you wrong answers with
        total confidence — so here is how to clean it first, free, without installing anything.
      </p>
      <H2>The 5-minute cleaning checklist</H2>
      <STEPS
        steps={[
          { t: 'Upload your file', d: 'Drop your CSV or Excel file into the free DataInsight Pro workspace. The automatic profile flags missing values, duplicates, and suspicious outliers for you.' },
          { t: 'Remove duplicate rows', d: 'One click drops exact duplicates. For fuzzy ones (same customer, slightly different spelling), sort and eyeball the top offenders.' },
          { t: 'Handle missing values', d: 'Fill blanks with the column average or median for numbers, the most common value for categories — or drop rows that are mostly empty.' },
          { t: 'Standardize labels', d: 'Merge variants like "USA", "U.S.A.", and "United States" into one consistent value so your charts and totals are correct.' },
          { t: 'Check numbers are numbers', d: 'Values stored as text ("1,200" with a comma, or "$50") will not sum or average. Convert them before you analyze.' },
        ]}
      />
      <H2>Signs your data needs cleaning</H2>
      <UL
        items={[
          'Totals that do not match what you expect — usually duplicates or text-as-numbers.',
          'Charts with a mysterious blank category — that is missing values showing up.',
          'The same thing appearing as multiple categories — inconsistent labels splitting your data.',
          'Averages that feel wrong — often one extreme outlier pulling the mean.',
        ]}
      />
      <H2>How clean is clean enough?</H2>
      <p>
        You do not need perfection — you need the errors small enough not to change your
        conclusions. Clean the columns you actually analyze and report on; ignore cosmetic
        quirks in columns nobody reads. When in doubt, document what you changed so anyone
        can reproduce your work.
      </p>
      <p>
        Dealing with repeats specifically? See <Link to="/guides/remove-duplicates" className="text-blue-600 hover:underline">how to remove duplicates from a CSV or Excel file</Link>.
      </p>
    </ArticleShell>
  );
}

function RemoveDuplicatesGuide() {
  const guide = GUIDES[4];
  return (
    <ArticleShell guide={guide}>
      <p>
        Duplicate rows are the silent killers of good analysis. The same order imported twice
        inflates revenue; the same customer counted twice skews every segment. Here is how to
        find and remove them in under a minute.
      </p>
      <H2>Remove duplicates in 3 steps</H2>
      <STEPS
        steps={[
          { t: 'Upload your CSV or Excel file', d: 'Drop it into the free DataInsight Pro workspace — your file stays on your computer, nothing is uploaded to a server.' },
          { t: 'Run duplicate detection', d: 'The data cleaner scans every row and flags exact duplicates instantly, showing you how many it found before changing anything.' },
          { t: 'Remove and verify', d: 'Drop the duplicates with one click, then check your row count and totals to confirm the numbers now make sense.' },
        ]}
      />
      <H2>Exact vs. near duplicates</H2>
      <UL
        items={[
          'Exact duplicates — every cell identical. Safe to remove automatically; they add zero information.',
          'Near duplicates — same customer as "Jon Smith" and "John Smith". These need a human eye: sort by the suspicious column and merge carefully.',
          'False duplicates — two genuinely separate orders that happen to look alike. Never dedupe on a single column; use the full row or a unique ID.',
        ]}
      />
      <H2>Prevent them next time</H2>
      <p>
        Most duplicates come from importing the same export twice or merging files with
        overlapping date ranges. Keep a simple log of what you imported and when — and always
        dedupe right after combining files, before any analysis.
      </p>
      <p>
        Cleaning a whole messy dataset? Read the full <Link to="/guides/clean-data-online" className="text-blue-600 hover:underline">guide to cleaning data online</Link>.
      </p>
    </ArticleShell>
  );
}

function CorrelationGuide() {
  const guide = GUIDES[5];
  return (
    <ArticleShell guide={guide}>
      <p>
        Does more ad spend really bring more sales? Do long support tickets predict cancellations?
        Correlation analysis answers exactly these questions — measuring how strongly two things
        move together, on a scale from -1 to +1. No statistics degree required.
      </p>
      <H2>Run it in 3 steps</H2>
      <STEPS
        steps={[
          { t: 'Upload your data', d: 'Drop your CSV or Excel file into the free DataInsight Pro workspace.' },
          { t: 'Open the correlation view', d: 'Pick the numeric columns you want to compare. The tool computes every pair at once and draws a color-coded heatmap.' },
          { t: 'Read the heatmap', d: 'Dark red or blue squares are strong relationships; pale squares are noise. Click any cell to see the exact correlation number.' },
        ]}
      />
      <H2>How to read the number</H2>
      <UL
        items={[
          '+0.7 to +1.0 — strong positive: when one goes up, the other reliably goes up too.',
          '-0.7 to -1.0 — strong negative: when one goes up, the other reliably goes down.',
          '-0.3 to +0.3 — weak or no real relationship; do not base decisions on it.',
          'Correlation is not causation — ice cream sales and drownings correlate because of summer, not because of each other.',
        ]}
      />
      <H2>What to do with a strong correlation</H2>
      <p>
        A strong correlation is a lead, not a verdict. Use it to decide what to investigate
        next: run a controlled comparison, check the trend over time, or segment the data to
        see if the relationship holds for every group. The heatmap tells you where to look —
        your judgment decides what it means.
      </p>
      <p>
        Want to slice the numbers first? Learn <Link to="/guides/pivot-table-online" className="text-blue-600 hover:underline">how to make a pivot table online</Link>.
      </p>
    </ArticleShell>
  );
}

function PivotTableGuide() {
  const guide = GUIDES[6];
  return (
    <ArticleShell guide={guide}>
      <p>
        You have 20,000 rows of sales and someone asks "revenue by region and quarter?" — a pivot
        table answers in seconds what would take an afternoon of manual formulas. Here is how to
        build one online, without Excel.
      </p>
      <H2>Build a pivot table in 4 steps</H2>
      <STEPS
        steps={[
          { t: 'Upload your spreadsheet', d: 'Drop your CSV or Excel file into the free DataInsight Pro workspace.' },
          { t: 'Choose your rows', d: 'Pick the category to group by — region, product, salesperson, month.' },
          { t: 'Choose your values', d: 'Pick the number to summarize and how: sum for revenue, average for ratings, count for orders.' },
          { t: 'Read the summary', d: 'You get a clean compact table: one row per group, totals at the bottom. Export it or turn it into a chart.' },
        ]}
      />
      <H2>Pivot tables answer questions like</H2>
      <UL
        items={[
          'Total sales per product per quarter — the classic management report.',
          'Average response time per support agent — spot your stars and bottlenecks.',
          'Order count per customer segment — see exactly where volume comes from.',
          'Any "break this big number down by that category" question your boss asks.',
        ]}
      />
      <H2>Tips for good pivots</H2>
      <p>
        Clean your category labels first — "North" and "north " will split into two rows and
        silently halve your totals. And remember: a pivot summarizes, it does not explain.
        When a number surprises you, drill into that group and look at the underlying rows
        before drawing conclusions.
      </p>
      <p>
        Summarized? Now find what drives the numbers with <Link to="/guides/correlation-analysis" className="text-blue-600 hover:underline">correlation analysis</Link>.
      </p>
    </ArticleShell>
  );
}

export function GuidesIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 mb-3">
              <BookOpen className="w-4 h-4" /> Guides & tutorials
            </p>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Learn data analysis, step by step</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Practical, jargon-free guides to analyzing CSV and Excel data — using free online tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                to={`/guides/${g.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-blue-400 hover:shadow-lg transition flex flex-col"
              >
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {g.readTime}
                </p>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{g.title}</h2>
                <p className="text-sm text-gray-600 flex-1">{g.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Read guide <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function GuideArticle() {
  const { slug } = useParams<{ slug: string }>();
  if (slug === 'analyze-csv-online') return <CsvGuide />;
  if (slug === 'excel-charts') return <ExcelChartsGuide />;
  if (slug === 'csv-vs-excel') return <CsvVsExcelGuide />;
  if (slug === 'clean-data-online') return <CleanDataGuide />;
  if (slug === 'remove-duplicates') return <RemoveDuplicatesGuide />;
  if (slug === 'correlation-analysis') return <CorrelationGuide />;
  if (slug === 'pivot-table-online') return <PivotTableGuide />;
  return <Navigate to="/guides" replace />;
}
