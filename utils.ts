import {
  DOMParser,
  Element,
} from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

const { mkdir, writeTextFile } = Deno;

const encoding = 'ISO-8859-1';
const newEncoding = 'UTF-8';

export function clean(s: string) {
  return s.replace('/', '');
}

export function getLinks(content: string) {
  const parsed = new DOMParser().parseFromString(content, 'text/html');
  const links = parsed?.querySelectorAll('a') || [];

  return [...links] as Element[];
}

export async function fetchPage(url: string) {
  const resp = await fetch(url);
  return await resp.text();
}

export async function fetchDecodedText(url: string) {
  const resp = await fetch(url);
  const buffer = await resp.arrayBuffer();

  const decoded = new TextDecoder(encoding).decode(buffer);

  return decoded.replace(encoding, newEncoding);
}

export async function writeXML(path: string, xml: string) {
  const fileName = path + '.xml';
  const filePath = path.split('/').slice(0, -1).join('/');

  await mkdir(filePath, { recursive: true });
  await writeTextFile(fileName, xml);
}

export async function getXML(baseUrl: string, path: string) {
  const fileUrl = [baseUrl, path, 'planDeCompte.xml'].join('/');
  return await fetchDecodedText(fileUrl);
}

export async function search(
  baseUrl: string,
  ...folders: string[]
): Promise<any> {
  const url = [baseUrl, ...folders].join('/');

  const content = await fetchDecodedText(url);
  const links = getLinks(content).map(e => e.attributes.href);

  if (links.includes('planDeCompte.xml')) {
    return folders.join('/');
  } else {
    return Promise.all(
      links
        .filter(href => href !== '../' && href.endsWith('/'))
        .map(clean)
        .map(async link => await search(baseUrl, ...folders, link))
        .flat(Infinity),
    );
  }
}
