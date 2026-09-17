import { PROBLEMS_PER_STACK, QUESTIONS_PER_TEST, SKILL_STACKS, getSkillStack } from "./skill-stacks";

export type SkillMcq = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  category: string;
  kind: "mcq";
};

type Topic = { name: string; correct: string; wrong: [string, string, string] };

const TOPICS: Record<string, Topic[]> = {
  mern: [
    { name: "MongoDB documents", correct: "Documents are JSON-like and stored in collections", wrong: ["Every document must use the same columns", "MongoDB only stores CSV rows", "Collections require a rigid SQL schema"] },
    { name: "Express routing", correct: "Define HTTP method + path handlers on an app or router", wrong: ["Routes must live in MongoDB", "Express cannot read request bodies", "Only GraphQL is supported"] },
    { name: "React state", correct: "State updates should go through setState/useState so UI re-renders", wrong: ["Mutate state objects in place only", "Store all state in cookies", "React state is write-once"] },
    { name: "Node.js I/O", correct: "Non-blocking I/O lets one thread handle many connections", wrong: ["Node always uses one OS thread per request", "File I/O cannot be async", "Node has no event loop"] },
    { name: "REST APIs", correct: "Use nouns and HTTP verbs (GET/POST/PATCH/DELETE) consistently", wrong: ["Put passwords in query strings", "Return HTML only", "Never use status codes"] },
    { name: "JWT auth", correct: "Sign tokens on the server and verify them on protected routes", wrong: ["Store the signing secret in the JWT payload", "JWTs cannot expire", "Send JWTs as GET query params by default"] },
    { name: "Mongoose models", correct: "Schemas describe fields, types, and validation for documents", wrong: ["Mongoose replaces React", "Schemas are only for SQL joins", "Models cannot validate input"] },
    { name: "CORS", correct: "The browser blocks cross-origin API calls unless the server allows them", wrong: ["CORS is a MongoDB index type", "CORS encrypts passwords", "CORS only affects CSS"] },
    { name: "Environment secrets", correct: "Keep API keys in env vars, never in client bundles", wrong: ["Commit .env to git for teammates", "Put secrets in React components", "Hard-code keys in Express routes in production"] },
    { name: "Pagination", correct: "Limit and skip/cursor results so lists stay fast", wrong: ["Always load the full collection", "Pagination is only a CSS trick", "MongoDB cannot limit results"] },
    { name: "Indexes", correct: "Index fields you filter/sort on to speed queries", wrong: ["Indexes slow every write and never help reads", "You may only index _id", "Indexes replace backups"] },
    { name: "Error middleware", correct: "Centralize Express error handling so APIs return consistent errors", wrong: ["Swallow all errors with empty catch", "Return stack traces to every client", "Never log errors"] },
  ],
  python: [
    { name: "lists vs tuples", correct: "Lists are mutable; tuples are immutable sequences", wrong: ["Tuples can append items", "Lists cannot hold mixed types", "Tuples are only for strings"] },
    { name: "list comprehensions", correct: "They build a new list from an expression and optional filter", wrong: ["They mutate the original list in place only", "They only work on dictionaries", "They disable functions"] },
    { name: "dicts", correct: "Keys must be hashable; values can be any object", wrong: ["Keys can be unhashable lists", "Dicts keep duplicate keys", "Dicts cannot be iterated"] },
    { name: "None", correct: "None is a singleton used for missing values", wrong: ["None equals 0", "None equals False in identity checks with is", "None is the same as an empty string"] },
    { name: "virtualenv", correct: "Isolate project dependencies from the system Python", wrong: ["It compiles Python to Java", "It is only for Windows", "It replaces pip"] },
    { name: "exceptions", correct: "Catch specific exceptions and avoid bare except where possible", wrong: ["Always use except: pass", "Exceptions cannot carry messages", "try cannot have finally"] },
    { name: "generators", correct: "yield produces values lazily without building the full list", wrong: ["Generators store every item in RAM first", "yield is the same as return", "Generators cannot iterate"] },
    { name: "PEP 8", correct: "It is the style guide for readable Python code", wrong: ["It is a web framework", "It replaces unittest", "It is a database"] },
    { name: "f-strings", correct: "f\"{value}\" interpolates expressions inside strings", wrong: ["f-strings cannot call functions", "They only work in Python 2", "They disable unicode"] },
    { name: "__init__", correct: "It initializes a new instance after allocation", wrong: ["It destroys the object", "It is required to import a module", "It runs only on class definition"] },
    { name: "pip", correct: "Install packages from PyPI into the current environment", wrong: ["pip is a Python web server", "pip compiles C++ only", "pip cannot pin versions"] },
    { name: "GIL", correct: "It limits one thread running Python bytecode at a time in CPython", wrong: ["It makes all C extensions illegal", "It removes multiprocessing", "It is a Django setting"] },
  ],
  javascript: [
    { name: "const vs let", correct: "const prevents rebinding; let allows reassignment in a block", wrong: ["const objects cannot have property updates", "let is function-scoped like var", "const is hoisted without TDZ"] },
    { name: "closures", correct: "A function remembers variables from the scope where it was created", wrong: ["Closures only work in classes", "Closures copy globals by value always", "Closures disable garbage collection"] },
    { name: "== vs ===", correct: "=== compares without coercing types", wrong: ["== never coerces", "=== converts strings to numbers first", "They are identical"] },
    { name: "promises", correct: "They represent a future value and chain with then/catch/finally", wrong: ["They block the thread until done", "They cannot fail", "await cannot be used with them"] },
    { name: "event loop", correct: "It drains the call stack then runs ready microtasks and macrotasks", wrong: ["It runs all timeouts before promises", "JavaScript is multi-threaded by default", "The event loop is a DOM API only"] },
    { name: "array map", correct: "map returns a new array of transformed items", wrong: ["map mutates the original array", "map is only for objects", "map cannot return values"] },
    { name: "this", correct: "In a regular function, this depends on how the function is called", wrong: ["Arrow functions bind this dynamically on call", "this is always the global object in modules", "this is a Python keyword"] },
    { name: "JSON", correct: "JSON.stringify/parse convert between objects and strings", wrong: ["JSON can represent undefined keys natively", "JSON.parse executes functions", "JSON is a database"] },
    { name: "modules", correct: "import/export share bindings between files", wrong: ["require is the only ES module syntax", "Circular imports always crash silently", "Browsers cannot load modules"] },
    { name: "NaN", correct: "NaN !== NaN; use Number.isNaN to test", wrong: ["NaN equals 0", "typeof NaN is \"undefined\"", "NaN is not a number type in IEEE floats"] },
    { name: "spread", correct: "... copies enumerable own properties or array items", wrong: ["Spread mutates the source array", "Spread only works on numbers", "Spread clones functions' source code"] },
    { name: "async/await", correct: "await pauses the async function until the promise settles", wrong: ["await blocks the entire OS process", "async functions return strings", "You cannot try/catch await"] },
  ],
  typescript: [
    { name: "type vs interface", correct: "Both describe shapes; interfaces can merge, types can use unions easily", wrong: ["Types cannot describe objects", "Interfaces cannot have methods", "You must pick only classes"] },
    { name: "generics", correct: "They let functions and types work over many types safely", wrong: ["Generics erase runtime checks and types at compile only is false", "Generics are only for React", "Generics disable inference"] },
    { name: "unknown", correct: "You must narrow unknown before using it as a specific type", wrong: ["unknown is the same as any", "unknown disables typecheck", "You can call unknown values freely"] },
    { name: "any", correct: "any opts out of type checking and should be rare", wrong: ["any is safer than unknown", "any is required for arrays", "any preserves exhaustive checks"] },
    { name: "strict null checks", correct: "string | null must be handled before use", wrong: ["null is always assignable to string", "undefined is identical to 0", "strict mode is a runtime VM flag only"] },
    { name: "discriminated unions", correct: "A shared literal field lets TypeScript narrow variants", wrong: ["Unions cannot be switched on", "Discriminants must be functions", "They only work in Java"] },
    { name: "readonly", correct: "It prevents reassignment of a property in the type system", wrong: ["It encrypts the property", "It is a runtime freeze always", "readonly arrays can push"] },
    { name: "tsconfig", correct: "compilerOptions control target, JSX, and strictness", wrong: ["tsconfig is a Docker file", "It cannot include path aliases", "It replaces package.json"] },
    { name: "utility types", correct: "Partial, Pick, Omit, and Record transform existing types", wrong: ["They exist only at runtime", "Omit adds required keys", "Record cannot use string keys"] },
    { name: "enums", correct: "Numeric enums exist at runtime; prefer union literals for many cases", wrong: ["Enums cannot have string values", "Enums are always erased", "Enums replace modules"] },
    { name: "declaration files", correct: ".d.ts describe types for JavaScript libraries", wrong: ["They contain runnable business logic", "They replace npm packages", "They are only for CSS"] },
    { name: "satisfies", correct: "It checks a value matches a type without widening it", wrong: ["It is the same as as any", "It disables inference", "It is a runtime operator"] },
  ],
  django: [
    { name: "models", correct: "Models map to database tables via the ORM", wrong: ["Models are only HTML templates", "Models cannot have relations", "Models replace urls.py"] },
    { name: "migrations", correct: "They version schema changes and apply them to the database", wrong: ["They compile Python to C", "They are browser caches", "They store static files"] },
    { name: "views", correct: "Views take a request and return a response", wrong: ["Views are MySQL triggers", "Views cannot use ORM", "Class views are illegal"] },
    { name: "urls.py", correct: "It maps URL patterns to views", wrong: ["It stores passwords", "It is a CSS file", "It replaces settings.py"] },
    { name: "templates", correct: "Django templates render HTML with context data", wrong: ["Templates run on the database server", "They cannot escape HTML", "They replace models"] },
    { name: "admin", correct: "It provides a generated back office for registered models", wrong: ["Admin is a frontend SPA framework", "Admin cannot authenticate staff", "Admin is required for APIs"] },
    { name: "QuerySet", correct: "QuerySets are lazy until evaluated", wrong: ["QuerySets always hit the DB on creation", "They cannot filter", "They are JSON only"] },
    { name: "settings", correct: "INSTALLED_APPS, MIDDLEWARE, and DATABASES configure the project", wrong: ["Settings cannot use env vars", "There is no DEBUG flag", "Settings are stored in the browser"] },
    { name: "forms", correct: "Forms validate and clean user input", wrong: ["Forms skip CSRF by default in POST", "Forms cannot render widgets", "Forms replace models"] },
    { name: "user auth", correct: "django.contrib.auth provides users, permissions, and sessions", wrong: ["Django cannot hash passwords", "Auth is only LDAP", "Sessions cannot be stored"] },
    { name: "N+1 queries", correct: "Use select_related/prefetch_related to avoid extra queries", wrong: ["N+1 is a CSS bug", "Django cannot join tables", "prefetch always slows lists"] },
    { name: "DRF", correct: "Django REST Framework builds serializers and viewsets for APIs", wrong: ["DRF is a database", "DRF cannot authenticate", "DRF replaces PostgreSQL"] },
  ],
  flask: [
    { name: "app factory", correct: "create_app() builds the Flask app so tests and configs stay clean", wrong: ["Flask forbids factories", "The app must be a global only", "Factories disable blueprints"] },
    { name: "blueprints", correct: "They group routes and templates into reusable modules", wrong: ["Blueprints are SQL tables", "Blueprints replace Jinja", "One app can have only one route"] },
    { name: "Jinja", correct: "It renders templates with {{ }} and auto-escaping by default", wrong: ["Jinja executes raw SQL", "Jinja is a WSGI server", "Jinja cannot loop"] },
    { name: "request context", correct: "request is available while a request is being handled", wrong: ["request is a global across threads without context", "Flask has no request object", "request cannot read JSON"] },
    { name: "g object", correct: "g stores request-scoped data", wrong: ["g is a database", "g persists forever like Redis", "g replaces sessions"] },
    { name: "extensions", correct: "Flask-SQLAlchemy, Login, and Migrate add common features", wrong: ["Flask cannot use extensions", "Extensions must be written in Go", "Extensions replace Python"] },
    { name: "config", correct: "Load config from objects or env, not hardcoded secrets", wrong: ["Config can only be XML", "SECRET_KEY is optional in production sessions", "Config cannot change per environment"] },
    { name: "error handlers", correct: "Register handlers for 404/500 to return JSON or HTML", wrong: ["Flask cannot catch 404", "Errors must crash the process", "Handlers only work in Django"] },
    { name: "JSON APIs", correct: "Use jsonify or return dicts (newer Flask) with status codes", wrong: ["Flask cannot return JSON", "Status codes are only strings", "POST cannot read JSON"] },
    { name: "testing", correct: "app.test_client() sends requests without a live server", wrong: ["Flask cannot be tested", "Tests must use Selenium only", "test_client writes to production DB always"] },
    { name: "WSGI", correct: "Flask apps are WSGI and run behind gunicorn/uwsgi in production", wrong: ["flask run is the only production server", "WSGI is a database protocol", "Flask is only ASGI"] },
    { name: "sessions", correct: "Signed cookies store session data unless you use a server backend", wrong: ["Sessions cannot be signed", "Flask sessions require MongoDB", "Cookies cannot be httpOnly"] },
  ],
  laravel: [
    { name: "Eloquent", correct: "Eloquent is Laravel's Active Record ORM", wrong: ["Eloquent is a CSS framework", "Eloquent cannot define relations", "Eloquent replaces Nginx"] },
    { name: "artisan", correct: "php artisan runs generators, migrations, and queues", wrong: ["Artisan is a frontend bundler", "Artisan cannot make controllers", "Artisan is Python"] },
    { name: "migrations", correct: "They version database schema in code", wrong: ["Migrations are Blade files", "They cannot roll back", "They store uploaded images"] },
    { name: "Blade", correct: "Blade compiles templates with @if, @foreach, and components", wrong: ["Blade is a database", "Blade cannot escape output", "Blade replaces PHP"] },
    { name: "routing", correct: "routes/web.php and api.php map URIs to controllers", wrong: ["Routes cannot use middleware", "All routes must be GET", "Routes live only in .env"] },
    { name: "middleware", correct: "It filters HTTP requests (auth, CSRF, throttle)", wrong: ["Middleware is a MySQL view", "CSRF is disabled for web by default", "Middleware cannot abort"] },
    { name: "service container", correct: "It resolves class dependencies via the container", wrong: ["It is a Redis clone", "Laravel cannot inject classes", "The container is only for CSS"] },
    { name: "queues", correct: "Jobs run in the background via workers", wrong: ["Queues block the HTTP request always", "Jobs cannot be retried", "Queues require Fortran"] },
    { name: "validation", correct: "Form Request or Validator::make rules incoming data", wrong: ["Validation is only frontend", "Laravel cannot validate JSON", "Rules cannot be reused"] },
    { name: "Eloquent relations", correct: "hasMany, belongsTo, and belongsToMany describe table links", wrong: ["Relations cannot eager load", "with() always N+1s", "Pivots are illegal"] },
    { name: "env", correct: ".env holds environment config; config() caches it in production", wrong: ["Commit .env with production secrets", "env() should be called everywhere at runtime in prod", ".env replaces the database"] },
    { name: "policies", correct: "Policies authorize user actions on models", wrong: ["Policies are CSS files", "Gates cannot be used", "Auth is only API tokens"] },
  ],
  react: [
    { name: "hooks", correct: "Hooks let function components use state and effects", wrong: ["Hooks work in class components", "Hooks can be called in loops freely", "useState is only for CSS"] },
    { name: "useEffect", correct: "It runs after render and can clean up on unmount", wrong: ["It runs on the server only", "It replaces event handlers", "Dependencies can be omitted safely always"] },
    { name: "keys", correct: "Stable keys help React match list items", wrong: ["Use array index if items reorder", "Keys are CSS ids", "Keys are optional for lists that change"] },
    { name: "props", correct: "Props flow down; they should be treated as read-only", wrong: ["Child should mutate parent props", "Props cannot be objects", "Props replace state always"] },
    { name: "lifting state", correct: "Move shared state to the closest common parent", wrong: ["Duplicate state in every child", "Use window globals first", "Context is illegal"] },
    { name: "memo", correct: "React.memo skips re-render when props are equal", wrong: ["memo makes every render faster always", "memo is for class components only", "memo replaces keys"] },
    { name: "controlled inputs", correct: "Value comes from state; onChange updates it", wrong: ["Uncontrolled is the only pattern", "value without onChange is ideal", "Inputs cannot be controlled"] },
    { name: "fragments", correct: "<> groups children without extra DOM nodes", wrong: ["Fragments create extra divs", "Fragments cannot have keys", "They replace portals"] },
    { name: "context", correct: "Context passes data through the tree without prop drilling", wrong: ["Context replaces all state libraries always", "Updating context never re-renders", "Context is only CSS variables"] },
    { name: "refs", correct: "refs hold a mutable value or a DOM node without re-rendering", wrong: ["Changing ref.current always re-renders", "refs are for CSS only", "You cannot focus an input with a ref"] },
    { name: "Strict Mode", correct: "In dev it double-invokes some logic to catch unsafe effects", wrong: ["It changes production behavior heavily", "It disables hooks", "It is a TypeScript flag"] },
    { name: "lists", correct: "Map arrays to elements with unique keys", wrong: ["for loops in JSX are the only way", "Arrays cannot render", "JSON.stringify the list into HTML"] },
  ],
  nodejs: [
    { name: "event loop", correct: "libuv plus the loop handle async I/O callbacks", wrong: ["Node is multi-threaded for all JS", "There is no callback queue", "CPU work never blocks"] },
    { name: "CommonJS", correct: "require/module.exports load modules synchronously by default", wrong: ["require is ES import syntax", "module.exports cannot export objects", "CJS cannot be used in Node"] },
    { name: "ESM", correct: "import/export work when type=module or .mjs", wrong: ["ESM cannot be used in Node 20+", "import is always blocking like require", "ESM forbids async"] },
    { name: "Buffer", correct: "Buffer holds binary data", wrong: ["Buffer is a string encoding only in browsers", "Buffer cannot be converted to string", "Buffer is a database"] },
    { name: "streams", correct: "Stream data in chunks instead of loading everything", wrong: ["Streams only work for UDP", "pipe cannot connect streams", "fs cannot create streams"] },
    { name: "process.env", correct: "Environment variables configure the process", wrong: ["They are readable from the browser automatically", "They replace argv", "They cannot be strings"] },
    { name: "cluster", correct: "Fork workers to use more CPU cores for JS", wrong: ["Cluster makes one process use all cores for a single thread", "Workers share memory freely", "Cluster is a database"] },
    { name: "npm", correct: "package.json lists dependencies and scripts", wrong: ["node_modules should always be committed", "npm cannot pin versions", "package-lock is optional chaos"] },
    { name: "error-first callbacks", correct: "Classic Node style is (err, result) => {}", wrong: ["Errors are thrown only", "The first argument is always the result", "Callbacks cannot nest"] },
    { name: "http module", correct: "http.createServer handles raw HTTP", wrong: ["Node cannot listen on ports", "HTTPS is impossible", "http cannot set headers"] },
    { name: "path", correct: "path.join builds filesystem paths safely", wrong: ["String concat is always safer", "path is a URL parser only", "Windows paths cannot be joined"] },
    { name: "worker_threads", correct: "They run JS in parallel threads for CPU work", wrong: ["They replace the event loop entirely", "They cannot pass messages", "They are browser-only"] },
  ],
  nextjs: [
    { name: "App Router", correct: "app/ folders define routes with page.tsx", wrong: ["pages/ is the only router in Next 13+", "Routes cannot nest layouts", "app/ is client-only"] },
    { name: "Server Components", correct: "They render on the server and can fetch data directly", wrong: ["They can use useState", "They run only in the browser", "They cannot be async"] },
    { name: "client components", correct: "Add \"use client\" for hooks and browser APIs", wrong: ["use client makes the whole app a SPA with no server", "Client components cannot be imported", "use client is a database"] },
    { name: "server actions", correct: "Functions with \"use server\" run on the server from forms", wrong: ["They are public unauthenticated RPCs with no checks", "They cannot redirect", "They replace SQL"] },
    { name: "next/image", correct: "It optimizes images and requires allowed remote hosts", wrong: ["It cannot set width", "Remote images need no config", "It replaces img in emails only"] },
    { name: "metadata", correct: "export const metadata sets title and SEO tags", wrong: ["Metadata is a CSS file", "It cannot be generated", "It only works in pages router"] },
    { name: "loading.tsx", correct: "It shows a fallback while a segment loads", wrong: ["It replaces error.tsx", "It is a database migration", "It cannot use React"] },
    { name: "route handlers", correct: "route.ts exports GET/POST for HTTP endpoints", wrong: ["API routes cannot read requests", "They only work in Express", "They replace middleware"] },
    { name: "env vars", correct: "NEXT_PUBLIC_ vars are exposed to the browser", wrong: ["All env vars are public", "Server secrets should use NEXT_PUBLIC_", "Env vars cannot be used in server code"] },
    { name: "caching", correct: "Understand fetch cache and revalidatePath/Tag", wrong: ["Next never caches", "Cache cannot be revalidated", "ISR is only PHP"] },
    { name: "middleware", correct: "proxy/middleware can redirect before a request is completed", wrong: ["It can use Node fs freely on Edge always", "It replaces page components", "It cannot read cookies"] },
    { name: "layouts", correct: "Layouts wrap pages and persist across navigations", wrong: ["Layouts remount on every link always", "Layouts cannot nest", "layout.tsx is optional for root only forever"] },
  ],
  php: [
    { name: "request cycle", correct: "Each request typically bootstraps PHP, runs the script, then ends", wrong: ["PHP always keeps one long-lived process like Node by default", "PHP cannot read POST", "PHP is only a database"] },
    { name: "arrays", correct: "PHP arrays are ordered maps that can be lists or hashes", wrong: ["Arrays cannot mix keys", "Arrays are immutable", "There are no associative arrays"] },
    { name: "PDO", correct: "Use prepared statements to avoid SQL injection", wrong: ["String-concat SQL is safest", "PDO cannot bind params", "mysqli_query with raw input is fine"] },
    { name: "composer", correct: "It installs PHP packages and autoloads classes", wrong: ["Composer is a web server", "autoload is optional always", "composer.json cannot pin versions"] },
    { name: "namespaces", correct: "They group classes and avoid name clashes", wrong: ["Namespaces replace composer", "use cannot import classes", "Namespaces are CSS"] },
    { name: "sessions", correct: "session_start() loads $_SESSION for the user", wrong: ["Sessions cannot store arrays", "Cookies are never used", "session_start is a SQL command"] },
    { name: "types", correct: "PHP 7+ supports scalar type hints and return types", wrong: ["PHP cannot hint types", "strict_types is illegal", "Types exist only in comments"] },
    { name: "exceptions", correct: "throw/try/catch handle errors in modern PHP", wrong: ["Exceptions cannot bubble", "trigger_error replaced exceptions entirely", "finally is illegal"] },
    { name: "templates", correct: "Keep HTML in views; escape output to prevent XSS", wrong: ["echo user HTML unsanitized", "PHP cannot mix HTML", "XSS only affects Python"] },
    { name: "autoloading", correct: "PSR-4 maps namespaces to folders", wrong: ["Every class must be require_once manually", "PSR-4 is a database", "Autoload cannot be generated"] },
    { name: "password hashing", correct: "password_hash and password_verify with bcrypt/argon2", wrong: ["Store md5 of passwords", "Encrypt with reversible AES only", "Plain text is fine behind HTTPS"] },
    { name: "superglobals", correct: "$_GET, $_POST, $_SERVER hold request data", wrong: ["They are private to functions only", "$_POST is JSON always", "They replace databases"] },
  ],
  java: [
    { name: "JVM", correct: "Java compiles to bytecode that the JVM runs", wrong: ["Java is interpreted line-by-line like bash only", "There is no garbage collector", "Bytecode cannot run on other OSes"] },
    { name: "equals", correct: "Override equals and hashCode together for value equality", wrong: ["== compares object contents for all objects", "hashCode is optional with equals", "equals cannot be overridden"] },
    { name: "generics", correct: "They provide compile-time type safety for collections", wrong: ["Generics reify all types at runtime fully", "List<String> can store Integer safely", "Generics are only for arrays"] },
    { name: "checked exceptions", correct: "Checked exceptions must be caught or declared", wrong: ["RuntimeException must be declared always", "IOException cannot be caught", "Java has no exceptions"] },
    { name: "streams", correct: "Stream API maps/filters collections in a pipeline", wrong: ["Streams always mutate the source list", "parallel() is always faster", "Streams replace SQL"] },
    { name: "synchronized", correct: "It serializes access to a block or method", wrong: ["It makes code wait-free lock-free", "It is the only concurrency tool", "Threads cannot share memory"] },
    { name: "Spring", correct: "Dependency injection wires beans in a container", wrong: ["Spring is a JVM vendor", "Beans cannot be injected", "Spring replaces javac"] },
    { name: "JPA", correct: "Entities map classes to tables", wrong: ["JPA is a CSS framework", "Entities cannot have ids", "JPA cannot query"] },
    { name: "packages", correct: "package + directory structure organize classes", wrong: ["Packages are only jar names", "import cannot use packages", "Default package is best for large apps"] },
    { name: "final", correct: "final variables cannot be reassigned", wrong: ["final classes can be subclassed", "final methods can be overridden", "final means immutable deep contents always"] },
    { name: "ArrayList vs LinkedList", correct: "ArrayList is usually faster for random access", wrong: ["LinkedList is always faster", "ArrayList cannot grow", "Lists cannot hold null"] },
    { name: "maven/gradle", correct: "They manage dependencies and the build", wrong: ["They are application servers", "pom.xml cannot declare deps", "Gradle cannot run tests"] },
  ],
  csharp: [
    { name: "CLR", correct: ".NET compiles to IL that the CLR runs", wrong: ["C# compiles only to native GCC", "There is no garbage collector", "IL cannot be JIT compiled"] },
    { name: "LINQ", correct: "Language-integrated queries over collections and data", wrong: ["LINQ is a database product", "LINQ cannot filter", "LINQ replaces HTTP"] },
    { name: "async/await", correct: "await yields until a Task completes", wrong: ["async blocks the thread always", "Task cannot fault", "await is only for UI"] },
    { name: "nullable reference types", correct: "string? means the value may be null", wrong: ["string can never be null in C#", "? is only for numbers", "Nullable context is a runtime VM"] },
    { name: "records", correct: "Records are reference types with value-like equality by default", wrong: ["Records cannot have properties", "Records are only structs", "with-expressions are illegal"] },
    { name: "ASP.NET Core", correct: "Minimal APIs and MVC handle HTTP in Kestrel", wrong: ["ASP.NET cannot run on Linux", "There is no dependency injection", "Controllers cannot bind JSON"] },
    { name: "Entity Framework", correct: "DbContext maps entities to tables", wrong: ["EF is a CSS framework", "Migrations cannot update schema", "LINQ to entities is impossible"] },
    { name: "using", correct: "using disposes IDisposable resources", wrong: ["using is only for imports", "IDisposable cannot be used", "GC always closes files instantly"] },
    { name: "interfaces", correct: "They define contracts classes can implement", wrong: ["C# cannot have interfaces", "A class can implement only one", "Interfaces store fields like classes always"] },
    { name: "NuGet", correct: "It is the package manager for .NET", wrong: ["NuGet is a web server", "csproj cannot reference packages", "Packages cannot version"] },
    { name: "span", correct: "Span<T> is a stack-friendly view over memory", wrong: ["Span can always be stored on the heap in fields freely in all cases", "Span is a database", "Span replaces strings entirely"] },
    { name: "dependency injection", correct: "Register services in the container and inject them", wrong: ["DI is only for Java", "Singleton is the only lifetime", "Controllers cannot take constructor args"] },
  ],
  go: [
    { name: "goroutines", correct: "go f() starts a concurrent function", wrong: ["Goroutines are OS processes always", "You must join them like pthreads always", "go keyword defines a package"] },
    { name: "channels", correct: "They pass values between goroutines safely", wrong: ["Channels are files", "Unbuffered channels never block", "close is illegal"] },
    { name: "interfaces", correct: "Satisfied implicitly by method sets", wrong: ["You must declare implements", "Interfaces cannot be empty", "io.Reader is not an interface"] },
    { name: "error handling", correct: "Return error values and check them", wrong: ["Go uses exceptions for all errors", "panic is the normal path", "errors cannot wrap"] },
    { name: "modules", correct: "go.mod declares the module path and deps", wrong: ["GOPATH is required instead of modules", "go get cannot add deps", "modules cannot version"] },
    { name: "slices", correct: "Slices are views on arrays with length and capacity", wrong: ["append never grows a slice", "Slices cannot hold structs", "Arrays and slices are identical"] },
    { name: "defer", correct: "defer runs when the surrounding function returns", wrong: ["defer runs immediately", "defer cannot close files", "Multiple defers are illegal"] },
    { name: "select", correct: "select waits on multiple channel operations", wrong: ["select is SQL only", "select cannot have default", "select blocks forever without cases"] },
    { name: "context", correct: "context.Context carries deadlines and cancelation", wrong: ["Context is a database", "You should store Context in structs always", "Cancel never stops work"] },
    { name: "go fmt", correct: "gofmt/go fmt is the standard formatter", wrong: ["Formatting is optional chaos", "gofmt is a linter only for security", "Tabs are forbidden"] },
    { name: "http", correct: "net/http ships a production-capable server", wrong: ["Go cannot listen on TCP", "handlers cannot read JSON", "http.Handler is not an interface"] },
    { name: "zero values", correct: "Uninitialized variables get 0, false, or nil", wrong: ["Variables start as undefined like JS", "nil maps can be written without make", "int zero is 1"] },
  ],
  rails: [
    { name: "MVC", correct: "Models, views, and controllers split responsibilities", wrong: ["Rails is only a database", "Views query MySQL directly always", "Controllers cannot render"] },
    { name: "Active Record", correct: "Models wrap tables and persist rows", wrong: ["AR is a CSS library", "Models cannot validate", "AR cannot define associations"] },
    { name: "routes.rb", correct: "It maps HTTP verbs and paths to controller actions", wrong: ["Routes are YAML only", "resources cannot generate CRUD", "Routes replace models"] },
    { name: "migrations", correct: "rake/rails db:migrate applies schema changes", wrong: ["Migrations are ERB views", "You cannot rollback", "Schema.rb is unused"] },
    { name: "ERB", correct: "Embedded Ruby renders HTML in views", wrong: ["ERB is a database", "<%= %> does not escape by default in modern Rails HTML", "Partials are illegal"] },
    { name: "strong params", correct: "Permit the fields a user may assign", wrong: ["Mass assignment of all params is fine", "params cannot be hashes", "Permit is a SQL keyword"] },
    { name: "callbacks", correct: "before_save and friends hook into the model lifecycle", wrong: ["Callbacks replace validations", "after_commit cannot run", "Callbacks are CSS"] },
    { name: "N+1", correct: "includes/preload eager loads associations", wrong: ["N+1 is a Ruby syntax error", "joins always eager loads objects", "Bullet is a database"] },
    { name: "bundler", correct: "Gemfile + bundle install manage gems", wrong: ["Gems cannot pin versions", "Gemfile.lock should not be committed for apps", "bundler is a web server"] },
    { name: "Turbolinks/Turbo", correct: "They speed navigation by avoiding full reloads", wrong: ["They replace the database", "They disable JavaScript", "They are PHP only"] },
    { name: "credentials", correct: "Encrypted credentials store secrets per environment", wrong: ["Commit RAW production keys in git", "ENV cannot be used", "credentials.yml is plaintext always"] },
    { name: "jobs", correct: "Active Job + a backend (Sidekiq, etc.) run work async", wrong: ["Jobs must run in the request", "Queues cannot retry", "Jobs replace cron only in CSS"] },
  ],
  vue: [
    { name: "reactivity", correct: "ref/reactive track dependencies and update the view", wrong: ["Mutating state never updates UI", "Vue cannot track objects", "Reactivity is a build plugin only"] },
    { name: "SFC", correct: "Single File Components hold template, script, and style", wrong: ["Vue forbids .vue files", "Templates cannot bind", "style cannot be scoped"] },
    { name: "v-for", correct: "Use a key when rendering lists", wrong: ["Keys are illegal in Vue 3", "v-for cannot nest", "index is always the best key"] },
    { name: "v-model", correct: "It is two-way binding sugar for value + event", wrong: ["v-model only works on divs", "It cannot be used on components", "It replaces Vuex always"] },
    { name: "computed", correct: "Cached values that recompute when deps change", wrong: ["computed is the same as a method always run", "computed cannot return values", "computed writes DOM directly"] },
    { name: "watch", correct: "Run a side effect when a source changes", wrong: ["watch replaces computed", "watch cannot be deep", "watch is CSS"] },
    { name: "Pinia", correct: "Pinia is the official store for Vue 3", wrong: ["Vuex is required in Vue 3", "Stores cannot be typed", "Pinia is a bundler"] },
    { name: "props", correct: "Declare props; do not mutate them in the child", wrong: ["Children should edit props in place", "props cannot have defaults", "props are only slots"] },
    { name: "emits", correct: "Components emit events to parents", wrong: ["Parents emit to children only", "emits cannot be declared", "Events replace props"] },
    { name: "slots", correct: "Parents pass template content into children", wrong: ["Slots are Vuex getters", "Named slots are illegal", "Slots cannot have fallbacks"] },
    { name: "Vue Router", correct: "It maps paths to components", wrong: ["Router is a database", "Navigation guards are illegal", "History mode cannot work"] },
    { name: "lifecycle", correct: "onMounted runs after the component is mounted", wrong: ["created is the only Vue 3 hook", "onUnmounted cannot clean up", "Lifecycle is a CSS animation"] },
  ],
  angular: [
    { name: "NgModules", correct: "They group declarations, imports, and providers (classic Angular)", wrong: ["Angular cannot have modules", "Modules replace components", "standalone is illegal"] },
    { name: "components", correct: "Decorated classes with templates and styles", wrong: ["Components cannot have inputs", "Templates cannot bind", "selector is optional always"] },
    { name: "RxJS", correct: "Observables model async streams", wrong: ["subscribe is optional for HTTP always", "Observables are promises", "RxJS is a CSS lib"] },
    { name: "dependency injection", correct: "Providers inject services into constructors", wrong: ["Angular cannot inject", "providedIn root is illegal", "Services must be new'ed manually"] },
    { name: "template binding", correct: "[prop] binds input; (event) listens; [(ngModel)] two-way", wrong: ["{{ }} assigns events", "[] is for CSS only", "ngModel requires no FormsModule"] },
    { name: "change detection", correct: "Default strategy checks the tree; OnPush checks on input refs", wrong: ["Angular never checks the view", "OnPush updates every keystroke globally always", "Change detection is a database"] },
    { name: "routing", correct: "RouterModule maps paths to components", wrong: ["Guards cannot block routes", "lazy loading is illegal", "router-outlet is CSS"] },
    { name: "pipes", correct: "They transform display values in templates", wrong: ["Pipes replace services", "async pipe cannot subscribe", "Pipes cannot be chained"] },
    { name: "forms", correct: "Template-driven or reactive forms validate input", wrong: ["Angular cannot validate", "FormControl is a CSS class only", "reactive forms forbid Observables"] },
    { name: "HttpClient", correct: "It returns Observables for HTTP", wrong: ["It only uses callbacks", "It cannot set headers", "It is a database driver"] },
    { name: "signals", correct: "Signals are a fine-grained reactive primitive in modern Angular", wrong: ["Signals replace the compiler", "Signals are RxJS Subjects only", "Angular 17 cannot use signals"] },
    { name: "CLI", correct: "ng generate scaffolds components and services", wrong: ["The CLI is a database", "ng build cannot produce production output", "schematics are illegal"] },
  ],
  sql: [
    { name: "SELECT", correct: "SELECT columns FROM table with optional WHERE", wrong: ["SELECT cannot filter", "FROM is optional always", "WHERE comes before SELECT in execution always as written"] },
    { name: "JOIN", correct: "INNER JOIN returns matching rows from both tables", wrong: ["JOIN cannot use ON", "LEFT JOIN drops all left rows", "JOIN is a Python keyword"] },
    { name: "GROUP BY", correct: "It groups rows for aggregates like COUNT/SUM", wrong: ["GROUP BY cannot use HAVING", "Aggregates work on ungrouped extra columns in strict SQL", "COUNT is a join type"] },
    { name: "indexes", correct: "B-tree indexes speed lookups and sorts on keyed columns", wrong: ["Indexes always speed writes", "Primary keys cannot be indexed", "Indexes store JSON only"] },
    { name: "transactions", correct: "BEGIN/COMMIT group statements atomically", wrong: ["ROLLBACK cannot undo", "Transactions are only for NoSQL", "AUTOCOMMIT cannot be disabled"] },
    { name: "normalization", correct: "Reduce redundancy by splitting tables and using keys", wrong: ["1NF allows repeating groups", "Foreign keys are illegal", "Normalization is a CSS method"] },
    { name: "NULL", correct: "NULL means unknown; compare with IS NULL", wrong: ["NULL = NULL is true", "NULL is 0", "WHERE col = NULL finds nulls"] },
    { name: "EXPLAIN", correct: "It shows the query plan so you can tune", wrong: ["EXPLAIN runs the query twice always", "Plans cannot use indexes", "EXPLAIN is a DML verb that deletes"] },
    { name: "primary key", correct: "It uniquely identifies a row", wrong: ["A table can have two primary keys", "PKs can be all-null", "PKs replace UNIQUE always identically"] },
    { name: "foreign key", correct: "It enforces that a value exists in a parent table", wrong: ["FKs cannot cascade", "FKs are indexes only with no constraint", "Child rows can always orphan"] },
    { name: "window functions", correct: "OVER() computes values across related rows without collapsing groups", wrong: ["ROW_NUMBER requires GROUP BY always", "Windows cannot partition", "They replace tables"] },
    { name: "injection", correct: "Use bound parameters, never concatenate user SQL", wrong: ["Escaping quotes by hand is enough always", "OR 1=1 is safe", "Prepared statements are slower and unused"] },
  ],
  devops: [
    { name: "CI", correct: "Continuous integration runs tests on every change", wrong: ["CI means deploying Friday nights only", "Tests should be manual only", "CI replaces git"] },
    { name: "CD", correct: "Continuous delivery/deployment ships working builds frequently", wrong: ["CD is a CSS property", "You should deploy untested artifacts", "CD forbids rollbacks"] },
    { name: "Docker", correct: "Images package app + deps; containers run them", wrong: ["Containers are full hypervisors always", "Dockerfiles cannot COPY files", "Images cannot be versioned"] },
    { name: "Kubernetes", correct: "It schedules containers across a cluster", wrong: ["k8s is a programming language", "Pods cannot restart", "Services cannot expose pods"] },
    { name: "IaC", correct: "Infrastructure as code (Terraform/CloudFormation) versions infra", wrong: ["Clicking the console cannot be replaced", "IaC cannot be reviewed in PRs", "State files are optional chaos"] },
    { name: "observability", correct: "Logs, metrics, and traces explain production behavior", wrong: ["SSH is the only debugging tool", "Metrics cannot alert", "Traces replace tests"] },
    { name: "SRE", correct: "Error budgets balance reliability and shipping speed", wrong: ["100% uptime is always the SLO", "Incidents should not be reviewed", "SLIs cannot be measured"] },
    { name: "secrets", correct: "Use a secret manager; rotate keys; never commit them", wrong: ["Put AWS keys in git", "Env vars in client apps are fine for private keys", "Rotation is optional forever"] },
    { name: "blue/green", correct: "Two environments let you switch traffic for safer deploys", wrong: ["Blue/green means CSS themes", "You cannot roll back", "It requires downtime always"] },
    { name: "health checks", correct: "Load balancers probe liveness/readiness endpoints", wrong: ["Health checks are only ping ICMP", "Unhealthy instances should keep traffic", "Kubernetes cannot probe"] },
    { name: "GitOps", correct: "Desired state in git is applied to the cluster", wrong: ["GitOps forbids PRs", "Clusters should be mutated by hand only", "Git cannot store YAML"] },
    { name: "rollback", correct: "Keep a previous artifact ready to restore service", wrong: ["Rollbacks are unnecessary with CI", "You should hotfix production only by editing servers", "Tags cannot mark releases"] },
  ],
  "react-native": [
    { name: "View vs div", correct: "Use View/Text instead of div/span on native", wrong: ["div works the same on iOS", "Text is optional around strings", "CSS files load like the web always"] },
    { name: "StyleSheet", correct: "Styles are JS objects, not cascading CSS files", wrong: ["className is the primary API", "flexbox is unavailable", "StyleSheet.create is required for colors only"] },
    { name: "Flexbox", correct: "The default direction is column, unlike the web", wrong: ["Default flexDirection is row like the web", "flex cannot grow", "alignItems is illegal"] },
    { name: "navigation", correct: "React Navigation (or similar) stacks screens", wrong: ["react-router-dom works unchanged", "There are no stacks", "Links are <a href> only"] },
    { name: "bridge/JSI", correct: "JS talks to native modules for device APIs", wrong: ["JavaScript can open iOS files without native code always", "Native modules are CSS", "Android cannot be targeted"] },
    { name: "lists", correct: "FlatList virtualizes long lists", wrong: ["ScrollView is best for 10k rows", "map in View is always faster", "keys are unused"] },
    { name: "platform", correct: "Platform.OS distinguishes ios and android", wrong: ["One binary cannot vary UI", "Platform is a database", "Android-only APIs run on iOS silently"] },
    { name: "safe area", correct: "SafeAreaView/insets avoid notches and home indicators", wrong: ["Safe areas are CSS margins on web only", "Notches cannot overlap UI", "paddingTop: 0 is enough always"] },
    { name: "permissions", correct: "Request camera/location permissions at runtime", wrong: ["Info.plist/manifest can be skipped", "Permissions are automatic", "iOS cannot deny"] },
    { name: "Hermes", correct: "Hermes is an optimized JS engine for React Native", wrong: ["Hermes is a database", "RN cannot use Hermes", "Hermes replaces Metro"] },
    { name: "Metro", correct: "Metro bundles JavaScript for development and release", wrong: ["Metro is nginx", "Hot reload is impossible", "Assets cannot be required"] },
    { name: "native builds", correct: "Xcode/Gradle produce the store binaries", wrong: ["expo/React Native never need native build tools", "APKs are built from CSS", "TestFlight is Android-only"] },
  ],
};

function rotate<T>(items: T[], offset: number) {
  const copy = [...items];
  const n = ((offset % copy.length) + copy.length) % copy.length;
  return copy.slice(n).concat(copy.slice(0, n));
}

export function questionId(slug: string, index: number) {
  return `${slug}:${index}`;
}

export function parseQuestionId(id: string) {
  const [slug, raw] = id.split(":");
  const index = Number(raw);
  return { slug, index };
}

export function getStackQuestion(slug: string, index: number): SkillMcq | null {
  const stack = getSkillStack(slug);
  const topics = TOPICS[slug];
  if (!stack || !topics?.length) return null;
  if (!Number.isInteger(index) || index < 0 || index >= PROBLEMS_PER_STACK) return null;

  const topic = topics[index % topics.length];
  const variant = Math.floor(index / topics.length) + 1;
  const prompts = [
    `In ${stack.name}, which statement about ${topic.name} is correct?`,
    `${stack.name} — best description of ${topic.name} (problem ${index + 1} of ${PROBLEMS_PER_STACK}):`,
    `You are working in ${stack.name}. What is the right way to think about ${topic.name}?`,
    `Which choice is true for ${topic.name} in ${stack.name}?`,
    `${stack.name} production review: pick the accurate note on ${topic.name}.`,
    `Interview set ${variant}: ${topic.name} in ${stack.name}.`,
    `A teammate is stuck on ${topic.name} (${stack.name}). Which guidance is sound?`,
    `Choose the correct ${stack.name} fact about ${topic.name}.`,
  ];
  const prompt = prompts[index % prompts.length];
  const unordered = [topic.correct, ...topic.wrong];
  const options = rotate(unordered, index);
  const correctIndex = options.indexOf(topic.correct);

  return {
    id: questionId(slug, index),
    prompt,
    options,
    correctIndex,
    category: stack.name,
    kind: "mcq",
  };
}

export function getStackQuestionById(id: string) {
  const { slug, index } = parseQuestionId(id);
  return getStackQuestion(slug, index);
}

export function pickTestQuestions(slug: string, count = QUESTIONS_PER_TEST): SkillMcq[] {
  if (!getSkillStack(slug) || !TOPICS[slug]) return [];
  const used = new Set<number>();
  const selected: SkillMcq[] = [];
  let guard = 0;
  while (selected.length < count && guard < count * 20) {
    guard += 1;
    const index = Math.floor(Math.random() * PROBLEMS_PER_STACK);
    if (used.has(index)) continue;
    used.add(index);
    const question = getStackQuestion(slug, index);
    if (question) selected.push(question);
  }
  return selected;
}

export function stackProblemCount(slug: string) {
  return getSkillStack(slug) && TOPICS[slug] ? PROBLEMS_PER_STACK : 0;
}

export { SKILL_STACKS, PROBLEMS_PER_STACK, QUESTIONS_PER_TEST };
