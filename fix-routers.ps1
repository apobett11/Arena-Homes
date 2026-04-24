$files = @(
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\unit\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\tenant\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\reporting\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\payment\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\maintenance\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\issue\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\lease\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\budget\router.ts",
    "c:\Users\HP\Desktop\Arena\arena-server\src\modules\announcement\router.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Add AuthenticatedRequest import if not present
        if ($content -match "import \{ authenticate, requireRole \} from '\.\./auth/middleware';") {
            $content = $content -replace "import \{ authenticate, requireRole \} from '\.\./auth/middleware';", "import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';"
        }
        
        # Replace async (req, res) with async (req: AuthenticatedRequest, res) for routes using auditContext
        $content = $content -replace "async \(req, res\) => \{([^}]*req\.auditContext)", "async (req: AuthenticatedRequest, res) => {`$1"
        
        Set-Content $file $content -NoNewline
        Write-Host "Fixed: $file"
    }
}
