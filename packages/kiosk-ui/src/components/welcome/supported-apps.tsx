import { ArrowRight, CheckCircle, Cpu, Download } from 'lucide-react';

export function SupportedApps() {
  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section Header - More concise */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Supported Applications</h2>
          <p className="text-muted-foreground">Compatible with professional GIS software</p>
        </div>

        {/* Apps Grid - Keep the good design but make it more subtle */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* QGIS Card */}
          <div className="group relative">
            <div className="relative p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-xl">
                    <img src="/src/assets/qgis-icon128.svg" alt="QGIS" className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">QGIS Desktop</h3>
                    <p className="text-sm text-muted-foreground">Open Source GIS</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 text-green-500" />
                  <span>Professional mapping & analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="h-3.5 w-3.5 text-green-500" />
                  <span>Direct token integration</span>
                </div>
              </div>

              <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                <span>Fully Supported</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* ArcGIS Pro Card */}
          <div className="group relative">
            <div className="relative p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <img src="/src/assets/ArcGIS_logo.png" alt="ArcGIS Pro" className="h-12 w-auto" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">ArcGIS Pro</h3>
                    <p className="text-sm text-muted-foreground">Enterprise GIS Platform</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 text-blue-500" />
                  <span>Advanced spatial analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="h-3.5 w-3.5 text-blue-500" />
                  <span>Seamless authentication</span>
                </div>
              </div>

              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                <span>Fully Supported</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
