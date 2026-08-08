using NUnit.Framework;

namespace SHI.Tests
{
    public sealed class ShiCampaignTests
    {
        [Test]
        public void ResolveClampsResourcesAndRecordsHistory()
        {
            var campaign = ShiCampaign.Parse("{\"schemaVersion\":1,\"id\":\"test\",\"title\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"subtitle\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"startNodeId\":\"start\",\"initialResources\":{\"grain\":95},\"sites\":[],\"characters\":[],\"sources\":[],\"nodes\":[{\"id\":\"start\",\"choices\":[{\"id\":\"go\",\"effects\":{\"grain\":20},\"flags\":[\"done\"]}]}]}");
            var state = ShiState.Create(campaign);
            var node = campaign.Node("start");

            state.Resolve(node, node.Choices[0]);

            Assert.That(state.Resources["grain"], Is.EqualTo(100));
            Assert.That(state.History, Has.Count.EqualTo(1));
            Assert.That(state.Completed, Is.True);
        }

        [Test]
        public void TextFallsBackToEnglish()
        {
            var campaign = ShiCampaign.Parse("{\"schemaVersion\":1,\"id\":\"test\",\"title\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"subtitle\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"startNodeId\":\"start\",\"initialResources\":{},\"sites\":[],\"characters\":[],\"sources\":[],\"nodes\":[{\"id\":\"start\",\"choices\":[]}]}");
            Assert.That(campaign.Text(campaign.Title, "fr"), Is.EqualTo("Test"));
        }
    }
}
