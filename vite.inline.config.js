/* Variante de un solo archivo para vistas previas que solo admiten HTML + archivos estáticos (p. ej. Claude). */
export default {
  base: './',
  build: {
    outDir: 'dist-inline', emptyOutDir: true,
    assetsInlineLimit: 200000, cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
}
