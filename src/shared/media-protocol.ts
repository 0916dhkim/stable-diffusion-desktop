/**
 * Custom protocol is required because the renderer cannot load file:// url.
 * We register custom protocol and pass through the file content via custom handler.
 */
export const MEDIA_PROTOCOL = "media";

export function bypassCspForMediaProtocol(protocol: Electron.Protocol) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_PROTOCOL,
      privileges: {
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        stream: true,
      },
    },
  ]);
}

export function registerMediaProtocolHandler(
  protocol: Electron.Protocol,
  net: Electron.Net
) {
  protocol.handle(MEDIA_PROTOCOL, (request) => {
    const url = request.url.replace(`${MEDIA_PROTOCOL}://`, "file://");
    return net.fetch(url);
  });
}

export function filePathToMediaUrl(filePath: string) {
  return `${MEDIA_PROTOCOL}://${filePath}`;
}
