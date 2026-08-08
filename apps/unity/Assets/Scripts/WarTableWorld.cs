using System.Collections.Generic;
using UnityEngine;

namespace SHI
{
    public sealed class WarTableWorld : MonoBehaviour
    {
        private readonly Dictionary<string, Renderer> markers = new();
        private readonly Dictionary<string, Material> baseMaterials = new();
        private readonly Dictionary<Collider, string> markerColliders = new();
        private Material? activeMaterial;
        private Material? inspectedMaterial;
        private Material? knownMaterial;
        private Material? reportedMaterial;
        private Material? referenceMaterial;
        private Camera? wartableCamera;
        private string activeSiteId = "";
        private string inspectedSiteId = "";

        public void Build(ShiCampaign campaign)
        {
            var cameraObject = new GameObject("Wartable Camera");
            cameraObject.transform.SetParent(transform);
            wartableCamera = cameraObject.AddComponent<Camera>();
            wartableCamera.transform.position = new Vector3(-2.3f, 7.8f, -8.5f);
            wartableCamera.transform.rotation = Quaternion.Euler(34, 12, 0);
            wartableCamera.fieldOfView = 43;
            wartableCamera.clearFlags = CameraClearFlags.SolidColor;
            wartableCamera.backgroundColor = new Color(0.045f, 0.049f, 0.042f);

            var lightObject = new GameObject("Warm Key");
            lightObject.transform.SetParent(transform);
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(0.88f, 0.72f, 0.48f);
            light.intensity = 1.2f;
            lightObject.transform.rotation = Quaternion.Euler(48, -28, 0);

            var table = GameObject.CreatePrimitive(PrimitiveType.Cube);
            table.name = "Carved strategic table";
            table.transform.SetParent(transform);
            table.transform.position = new Vector3(-2.3f, -0.45f, 0);
            table.transform.localScale = new Vector3(10.5f, 0.35f, 7.4f);
            table.GetComponent<Renderer>().material = CreateMaterial(new Color(0.11f, 0.1f, 0.075f), 0.16f);

            activeMaterial = CreateMaterial(new Color(0.72f, 0.43f, 0.16f), 0.55f);
            inspectedMaterial = CreateMaterial(new Color(0.84f, 0.68f, 0.37f), 0.72f);
            knownMaterial = CreateMaterial(new Color(0.25f, 0.31f, 0.27f), 0.35f);
            reportedMaterial = CreateMaterial(new Color(0.34f, 0.29f, 0.2f), 0.28f);
            referenceMaterial = CreateMaterial(new Color(0.18f, 0.2f, 0.18f), 0.16f);
            foreach (var site in campaign.Sites)
            {
                var marker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                marker.name = $"Site · {site.Id}";
                marker.transform.SetParent(transform);
                marker.transform.position = new Vector3(-7.1f + site.X / 10f, 0, -3.2f + site.Z / 11f);
                marker.transform.localScale = site.Status == "reference" ? new Vector3(.13f, .07f, .13f) : new Vector3(.19f, .12f, .19f);
                var renderer = marker.GetComponent<Renderer>();
                var baseMaterial = site.Status == "reported" ? reportedMaterial : site.Status == "reference" ? referenceMaterial : knownMaterial;
                renderer.material = baseMaterial;
                markers.Add(site.Id, renderer);
                baseMaterials.Add(site.Id, baseMaterial);
                markerColliders.Add(marker.GetComponent<Collider>(), site.Id);
            }

            var rainObject = new GameObject("Rain");
            rainObject.transform.SetParent(transform);
            rainObject.transform.position = new Vector3(-2, 4, 0);
            var rain = rainObject.AddComponent<ParticleSystem>();
            var main = rain.main;
            main.startLifetime = 2.2f;
            main.startSpeed = 5.5f;
            main.startSize = .025f;
            main.maxParticles = 900;
            main.startColor = new Color(.55f, .63f, .61f, .34f);
            var emission = rain.emission;
            emission.rateOverTime = 260;
            var shape = rain.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(12, .1f, 9);
            rainObject.transform.rotation = Quaternion.Euler(8, 0, -8);
        }

        public void SetActiveSite(string siteId)
        {
            activeSiteId = siteId;
            RefreshMarkers();
        }

        public void SetInspectedSite(string? siteId)
        {
            inspectedSiteId = siteId ?? "";
            RefreshMarkers();
        }

        public bool TryPickSite(Vector3 screenPosition, out string siteId)
        {
            siteId = "";
            if (wartableCamera == null || !Physics.Raycast(wartableCamera.ScreenPointToRay(screenPosition), out var hit, 100f)) return false;
            if (!markerColliders.TryGetValue(hit.collider, out var pickedSiteId)) return false;
            siteId = pickedSiteId;
            return true;
        }

        private void RefreshMarkers()
        {
            foreach (var marker in markers)
            {
                if (marker.Key == inspectedSiteId) marker.Value.material = inspectedMaterial;
                else if (marker.Key == activeSiteId) marker.Value.material = activeMaterial;
                else marker.Value.material = baseMaterials[marker.Key];
            }
        }

        private static Material CreateMaterial(Color color, float smoothness)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var material = new Material(shader) { color = color };
            material.SetFloat("_Smoothness", smoothness);
            return material;
        }
    }
}
