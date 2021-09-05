import { getPrismicClient } from '../../services/prismic';


import { Document } from '@prismicio/client/types/documents';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async function preview(req, res) {
  const { token: ref, documentId } = req.query

  const PrismicClient = getPrismicClient()

  const url = await PrismicClient.getPreviewResolver(ref, documentId).resolve(
    linkResolver,
    '/'
  )

  if (!url) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  res.setPreviewData({
    ref, 
  })

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${url}" />
    <script>window.location.href = '${url}'</script>
    </head>`
  )

  res.end()
}