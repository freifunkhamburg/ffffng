/**
 * Utility functions for node related data.
 */
import { MAC, MapId } from "../types";

/**
 * Converts the MAC address of a Freifunk node to an id representing it on the community's node map.
 *
 * @param mac - MAC address of the node
 * @returns ID of the node on the map
 */
export function mapIdFromMAC(mac: MAC): MapId {
    return mac.toLowerCase().replace(/:/g, "") as MapId;
}
