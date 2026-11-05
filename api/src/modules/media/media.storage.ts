import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { env } from '../../config/env'

export const UPLOAD_EXPIRES_IN = 300

const HEAD_BYTES = 12

let client: S3Client | undefined

function getClient() {
  client ??= new S3Client({ region: env.AWS_REGION, requestChecksumCalculation: 'WHEN_REQUIRED' })

  return client
}

export const mediaStorage = {
  async presignPut(key: string, contentType: string, size: number) {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    })

    return getSignedUrl(getClient(), command, {
      expiresIn: UPLOAD_EXPIRES_IN,
      signableHeaders: new Set(['content-type', 'content-length']),
    })
  },

  async head(key: string) {
    try {
      const object = await getClient().send(
        new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      )

      return { size: object.ContentLength ?? 0 }
    } catch (error) {
      if (error instanceof NotFound) return null

      throw error
    }
  },

  async readHead(key: string) {
    const object = await getClient().send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Range: `bytes=0-${HEAD_BYTES - 1}`,
      }),
    )

    return object.Body ? object.Body.transformToByteArray() : new Uint8Array()
  },

  async copy(from: string, to: string, contentType: string) {
    await getClient().send(
      new CopyObjectCommand({
        Bucket: env.S3_BUCKET,
        CopySource: `${env.S3_BUCKET}/${from}`,
        Key: to,
        ContentType: contentType,
        MetadataDirective: 'REPLACE',
      }),
    )
  },

  async remove(key: string) {
    await getClient().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
  },
}
