import { faker } from '@faker-js/faker';
import type { Connection, IAsset, IBundle, IClient, IConnection, JWKPrivateKey, JWKPublicKey } from '@map-colonies/auth-core';
import { AssetType, Environment } from '@map-colonies/auth-core';

const EIGHT = 8;
const THREE = 3;

export function getFakeAsset(includeCreated?: boolean): IAsset {
  return {
    createdAt: includeCreated === true ? faker.date.past() : undefined,
    environment: [Environment.NP],
    isTemplate: faker.datatype.boolean(),
    name: faker.string.alpha(EIGHT),
    type: faker.helpers.arrayElement(Object.values(AssetType)),
    uri: faker.system.filePath(),
    value: Buffer.from(faker.lorem.paragraph()).toString('base64'),
    version: 1,
  };
}

export function getFakeConnection(): Connection {
  return {
    createdAt: faker.date.past(),
    environment: Environment.NP,
    version: 1,
    name: faker.string.alpha(EIGHT),
    allowNoBrowserConnection: faker.datatype.boolean(),
    allowNoOriginConnection: faker.datatype.boolean(),
    domains: ['alpha', 'bravo'],
    origins: ['c', 'd'],
    enabled: true,
    token: faker.string.alpha(),
  };
}

export function getFakeIConnection(includeCreated?: boolean): IConnection {
  const connection: IConnection = getFakeConnection();
  connection.createdAt = includeCreated === true ? faker.date.past() : undefined;
  return connection;
}

export function getFakeBundle(includeCreated?: boolean): IBundle {
  return {
    id: includeCreated === true ? faker.number.int() : undefined,
    hash: faker.string.alpha(EIGHT),
    createdAt: includeCreated === true ? faker.date.past() : undefined,
    environment: Environment.NP,
    keyVersion: 1,
    assets: [{ name: 'aaaa', version: 1 }],
    connections: [{ name: 'bbb', version: 2 }],
    metadata: { ccc: 123 },
    opaVersion: '0.52.0',
  };
}

export function getFakeClient(includeGeneratedFields: boolean): IClient {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const client: IClient = {
    name: faker.internet.username({ firstName, lastName }),
    hebName: 'אבי',
    branch: faker.company.buzzVerb(),
    description: faker.lorem.paragraph(),
    techPointOfContact: {
      email: faker.internet.email({ firstName, lastName }),
      name: faker.person.fullName({ firstName, lastName }),
      phone: faker.phone.number(),
    },
    productPointOfContact: {
      email: faker.internet.email({ firstName, lastName }),
      name: faker.person.fullName({ firstName, lastName }),
      phone: faker.phone.number(),
    },
    tags: [faker.word.adjective(), faker.company.buzzNoun()],
  };

  if (includeGeneratedFields) {
    client.createdAt = faker.date.past();
    client.updatedAt = faker.date.between({ from: client.createdAt, to: Date.now() });
  }
  return client;
}

export function getMockKeys(): [JWKPrivateKey, JWKPublicKey] {
  const publicKey: JWKPublicKey = {
    alg: faker.string.alpha(THREE),
    e: faker.string.alpha(THREE),
    kid: faker.string.alpha(THREE),
    kty: faker.string.alpha(THREE),
    n: faker.string.alpha(THREE),
  };
  return [
    {
      ...publicKey,
      d: faker.string.alpha(THREE),
      dp: faker.string.alpha(THREE),
      dq: faker.string.alpha(THREE),
      p: faker.string.alpha(THREE),
      q: faker.string.alpha(THREE),
      qi: faker.string.alpha(THREE),
    },
    publicKey,
  ];
}

export function getRealKeys(): [JWKPrivateKey, JWKPublicKey] {
  const publicKey: JWKPublicKey = {
    kty: 'RSA',
    n: 'vxbyg6yr0Y3C5-Q4DkPoL1kluBr79usrbPABUHX9HQjqXcjAAiwvHCQqlUvAjx38sEY4FqN9RykyPNKcb_0tLvcBwf6Tdn79j9K9DPVhp0QuyP7NjqOliKpHJtftC5hHXi2Moxb7spJ3cUaIMi3YqHQr9QAP3hx1tBiRxq0R1CkMHK4cj0LAmXnzeOCuKdV09x4TfxvhlfvBYoWURUJr3EnJHUme9JAxpF6fn1jySAjcY2XOplOz2MQqIliERN1Ltmgtk91z2rUmYkZ0I4EVDKSttrcKaGLrKT69oD_BLwXdmZ5qaHnPtT1vCVgqUXxx89Cki0SIFT5bdefi5X0kNw',
    e: 'AQAB',
    alg: 'RS256',
    kid: 'test',
  };
  return [
    {
      kty: 'RSA',
      n: 'vxbyg6yr0Y3C5-Q4DkPoL1kluBr79usrbPABUHX9HQjqXcjAAiwvHCQqlUvAjx38sEY4FqN9RykyPNKcb_0tLvcBwf6Tdn79j9K9DPVhp0QuyP7NjqOliKpHJtftC5hHXi2Moxb7spJ3cUaIMi3YqHQr9QAP3hx1tBiRxq0R1CkMHK4cj0LAmXnzeOCuKdV09x4TfxvhlfvBYoWURUJr3EnJHUme9JAxpF6fn1jySAjcY2XOplOz2MQqIliERN1Ltmgtk91z2rUmYkZ0I4EVDKSttrcKaGLrKT69oD_BLwXdmZ5qaHnPtT1vCVgqUXxx89Cki0SIFT5bdefi5X0kNw',
      e: 'AQAB',
      d: 'M2MgZHiS3A-bUnD1AiEQ12rJ0fCvwX8Mdoc0U0bngl9bZ00NFYh8Qr0XFn8AkXwm7-ByRORCVFinweOBXjxfYjnapyimzz7nQT4SyOFUGX8kdbjP3oPziAUCjVeTz4Jr7s-g-lq75RGuPTASgCwED4juKTyTB8_vdzcEPMFeAgdv-xsD0V936GM1ZlI1Jvl11jsBndzVjtQiPydZsyHifEN0ZtJpyp9G9vGYSSyX6eaTIXbjIM0xte_jsNOZprAuBni4pTWVRgMmUOY6eP0qrlwd_DXq4P9617T43e55Y8YfdMRJnedHT2sM0ay5no7kRWrbcOW0gy65SGwtYNdkwQ',
      p: '-dG1-KyXuDPsxFr4NtX85NNnXirvV3wxtNb56YD5MQwSVW1ZM7mO8WNQ8s_WxyMaNADpPEkHsGZ8piAPdt-CQSE2vfa3TIPMwXVxxF_SfWkCIfFea-2cmdu0Nq0TrnpUd6sq-ynqJGvZPh8njUwpoLnTErC-9X-YVpBZB2WK6nU',
      q: 'w9FCS3KZPBwuRszrNGBM0IWL1LELXw026un_R2AQrCPqDLJHy9cNi7J2J5lm9fG1LedlYVSTrPG7snsIaACyArNO9wXgKX7CkI84ObYXWylJ0X0-BXQAIclrJLbfCfUxpEqp15CWzE7RmETOuIOD0JU5ZybaF2TpWm-ljKPIxns',
      dp: '6hN8fTBCzN8iZ22Ri9f_qO0Iuuxh7Mg6zuZrrkYht7pG53KZFWU1sapMa-cgqOCUKcv8vnbzVG8DNqlttAWDR8F2SJKGd5Q7Y73Gxqi-UrH0xJcj0N8IUAXTmzOa8G5A_QwOLt68PDotiQ6qAbQugSH8y1N-6gsPU3TXZp3Xhw0',
      dq: 'R4MekOszJw6rn9OqeiBJLUX4QR6_JmFvEu-N-QUOUa90BFr_eWP6YHA2UlPllCBHqJH_JkJ7BAfsIkxoT4Mhf3b4eaI9sSnH6H9Fa14ivXogqU7x3Y_1lGE4rdnTLpHLJVLXIBB_4fFO_iryy9PLydsVcaRwtWZ3Cj4H2YrfAg0',
      qi: 'sYFXsJ8PV3gotkjNvN92O_VNjNlStYWmsQO0fF3VXNxez5l0sBikSUKnkUWbqCFEsk_oKSn1GIhOZyOTkokihoHTlVqeVrecY7HHsbftBKvNF4d_cKb-sV2zxZUW5YZhXskF54Cje9IHtEwRvuPQ50yzPCkgwXAmhTsB9gOGODA',
      alg: 'RS256',
      kid: 'test',
    },
    publicKey,
  ];
}
