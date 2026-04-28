import { ContentCardEntity } from "@/types/cms";
import { City, District, Region, TourismObject } from "@/types/hierarchy";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) return "Slug не може бути порожнім";
  if (!slugRegex.test(trimmed)) {
    return "Slug має бути у форматі lower-kebab-case (латиниця, цифри, дефіси)";
  }
  return null;
}

export function validateObjectRelations(
  object: TourismObject,
  districts: District[],
  cities: City[],
) {
  const district = districts.find((item) => item.id === object.districtId);
  if (!district) return "Обраний район не існує";

  const city = cities.find((item) => item.id === object.cityId);
  if (!city) return "Обране місто не існує";
  if (city.districtId !== district.id) return "Місто не належить обраному району";

  return null;
}

export function validateObjectDraft(
  object: TourismObject,
  allObjects: TourismObject[],
  districts: District[],
  cities: City[],
) {
  const slugError = validateSlug(object.slug);
  if (slugError) return slugError;

  const duplicate = allObjects.find(
    (item) => item.id !== object.id && item.slug.trim().toLowerCase() === object.slug.trim().toLowerCase(),
  );
  if (duplicate) return "Slug має бути унікальним серед туристичних об'єктів";

  return validateObjectRelations(object, districts, cities);
}

export function validateContentCardDraft(
  card: ContentCardEntity,
  allCards: ContentCardEntity[],
  regions: Region[],
  districts: District[],
  cities: City[],
) {
  if (!card.pageKey.trim()) return "pageKey є обов'язковим";
  if (!card.sectionKey.trim()) return "sectionKey є обов'язковим";
  if (!card.title.trim()) return "Назва картки є обов'язковою";
  if (!Number.isFinite(card.sortOrder)) return "sortOrder має бути числом";

  const duplicateCount = allCards.filter((item) => item.id === card.id).length;
  if (duplicateCount > 1) return "ID картки має бути унікальним";

  const region = card.regionId ? regions.find((item) => item.id === card.regionId) : null;
  if (card.regionId && !region) return "Обрана область у картці не існує";

  const district = card.districtId ? districts.find((item) => item.id === card.districtId) : null;
  if (card.districtId && !district) return "Обраний район у картці не існує";
  if (district && card.regionId && district.regionId !== card.regionId) {
    return "Район не належить вибраній області";
  }

  const city = card.cityId ? cities.find((item) => item.id === card.cityId) : null;
  if (card.cityId && !city) return "Обране місто у картці не існує";
  if (city && district && city.districtId !== district.id) return "Місто не належить вибраному району";

  if (card.href && !card.href.startsWith("/") && !card.href.startsWith("http")) {
    return "Посилання картки має починатися з / або http";
  }

  return null;
}
